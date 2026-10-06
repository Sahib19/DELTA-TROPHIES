const LEGACY_SLUG = "bases-and-accessories";
const splitCategories = [
  {
    slug: "trophy-bases",
    name: "Trophy Bases",
    description: "Bases and plinths for custom trophy and award assembly.",
  },
  {
    slug: "medals",
    name: "Medals",
    description: "Award medals for sporting events, schools and celebrations.",
  },
  {
    slug: "trophy-accessories",
    name: "Trophy Accessories",
    description: "Sports figures, badges, pins and other trophy components.",
  },
];

export function accessoryCategorySlug(product) {
  const sku = String(product.sku || "").trim().toUpperCase();
  const name = String(product.name || "").toUpperCase();
  if (/\bMEDAL\b/.test(sku) || /\bMEDAL\b/.test(name)) return "medals";
  if (/\bBASE\b/.test(sku) && !/^CORNER\b/.test(sku)) return "trophy-bases";
  return "trophy-accessories";
}

export function splitAccessories(catalogue) {
  const legacyCategory = catalogue.categories.find(
    (category) => category.slug === LEGACY_SLUG,
  );
  if (!legacyCategory) return catalogue;

  const products = catalogue.products.map((product) => {
    if (product.category_slug !== LEGACY_SLUG) return product;
    const slug = accessoryCategorySlug(product);
    const category = splitCategories.find((item) => item.slug === slug);
    return {
      ...product,
      category_id: `${legacyCategory.id}-${slug}`,
      category_slug: slug,
      category_name: category.name,
    };
  });

  const categories = catalogue.categories.flatMap((category) => {
    if (category.slug !== LEGACY_SLUG) return [category];
    return splitCategories.map((definition, index) => {
      const groupProducts = products.filter(
        (product) => product.category_slug === definition.slug,
      );
      return {
        ...category,
        ...definition,
        id: `${legacyCategory.id}-${definition.slug}`,
        display_order: category.display_order + index / 10,
        thumbnail: groupProducts[0]?.images?.[0] || category.thumbnail,
        product_count: groupProducts.length,
      };
    });
  });

  return { ...catalogue, categories, products };
}

export const LEGACY_ACCESSORIES_SLUG = LEGACY_SLUG;
