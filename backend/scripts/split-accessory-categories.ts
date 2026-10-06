import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { CategoryModel } from '../src/models/category.model.js';
import { ProductModel } from '../src/models/product.model.js';
import { buildCatalogueManifest } from '../src/services/catalogue-publication.service.js';

const legacySlug = 'bases-and-accessories';
const folder = '12. BASE AND ACS';
const definitions = [
  {
    slug: 'trophy-bases',
    name: 'Trophy Bases',
    description: 'Bases and plinths for custom trophy and award assembly.',
    displayOrder: 12,
  },
  {
    slug: 'medals',
    name: 'Medals',
    description: 'Award medals for sporting events, schools and celebrations.',
    displayOrder: 13,
  },
  {
    slug: 'trophy-accessories',
    name: 'Trophy Accessories',
    description: 'Sports figures, badges, pins and other trophy components.',
    displayOrder: 14,
  },
] as const;

function targetSlug(sku: string | undefined, name: string): (typeof definitions)[number]['slug'] {
  const code = (sku ?? '').trim().toUpperCase();
  if (/\bMEDAL\b/.test(code) || /\bMEDAL\b/.test(name.toUpperCase())) return 'medals';
  if (/\bBASE\b/.test(code) && !/^CORNER\b/.test(code)) return 'trophy-bases';
  return 'trophy-accessories';
}

async function main(): Promise<void> {
  await connectDatabase();
  try {
    const legacy = await CategoryModel.findOne({ slug: legacySlug }).lean().exec();
    if (!legacy) throw new Error(`Category ${legacySlug} was not found`);

    const products = await ProductModel.find({ category: legacy._id })
      .select('_id sku name')
      .lean()
      .exec();
    const grouped = Object.fromEntries(definitions.map(({ slug }) => [slug, 0]));
    for (const product of products) {
      const slug = targetSlug(product.sku, product.name);
      grouped[slug] = (grouped[slug] ?? 0) + 1;
    }
    process.stdout.write(`${JSON.stringify({ legacyProducts: products.length, grouped })}\n`);

    if (!process.argv.includes('--apply')) return;

    const categoryIds = new Map<string, typeof legacy._id>();
    for (const definition of definitions) {
      const category = await CategoryModel.findOneAndUpdate(
        { slug: definition.slug },
        {
          $set: {
            name: definition.name,
            description: definition.description,
            displayOrder: definition.displayOrder,
            cloudinaryFolder: folder,
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      ).exec();
      if (!category) throw new Error(`Could not create ${definition.slug}`);
      categoryIds.set(definition.slug, category._id);
    }

    if (products.length) {
      await ProductModel.bulkWrite(
        products.map((product) => {
          const categoryId = categoryIds.get(targetSlug(product.sku, product.name));
          if (!categoryId) throw new Error(`Missing destination category for ${product.sku}`);
          return {
            updateOne: {
              filter: { _id: product._id, category: legacy._id },
              update: { $set: { category: categoryId } },
            },
          };
        }),
      );
    }

    const remaining = await ProductModel.countDocuments({ category: legacy._id }).exec();
    if (remaining) throw new Error(`${remaining} products still use the old category`);
    await CategoryModel.updateOne({ _id: legacy._id }, { $set: { isActive: false } }).exec();

    const oldDescription = 'trophy bases, medals & accessories collection';
    const categoryNames = new Map(
      definitions.map((definition) => [String(categoryIds.get(definition.slug)), definition.name]),
    );
    const staleDescriptions = await ProductModel.find({
      category: { $in: [...categoryIds.values()] },
      description: { $regex: oldDescription, $options: 'i' },
    })
      .select('_id category description')
      .lean()
      .exec();
    if (staleDescriptions.length) {
      await ProductModel.bulkWrite(
        staleDescriptions.map((product) => {
          const name = categoryNames.get(String(product.category));
          if (!name) throw new Error(`Missing category name for ${product._id.toString()}`);
          if (!product.description)
            throw new Error(`Missing description for ${product._id.toString()}`);
          return {
            updateOne: {
              filter: { _id: product._id },
              update: {
                $set: {
                  description: product.description.replace(
                    /trophy bases, medals & accessories collection/gi,
                    `${name.toLowerCase()} collection`,
                  ),
                },
              },
            },
          };
        }),
      );
    }

    const manifest = await buildCatalogueManifest();
    process.stdout.write(
      `${JSON.stringify({ categories: manifest.categories.length, products: manifest.products.length, descriptionsUpdated: staleDescriptions.length, version: manifest.version })}\n`,
    );
  } finally {
    await disconnectDatabase();
  }
}

await main();
