import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getCatalogueCategories,
  getCatalogueProducts,
  subscribeCatalogue,
} from "../api/catalogue";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import { SITE_NAME } from "../config/seo";
import SeoHead from "../components/SeoHead";

const PAGE_SIZE = 24;
const GROUPED_CATEGORY_SLUG = "la-aca-ra-f-models";
const GROUPED_PAGE_SIZE = 100;
const MODEL_GROUPS = [
  {
    code: "LA",
    name: "Wooden & Acrylic Awards",
    description: "LA Models",
  },
  {
    code: "F",
    name: "Frames",
    description: "F Models",
  },
  {
    code: "RA",
    name: "Resin Awards",
    description: "RA Models",
  },
  {
    code: "ACA",
    name: "Acrylic & Resin Awards",
    description: "ACA Models",
  },
];

function pageSizeFor(category) {
  return category === GROUPED_CATEGORY_SLUG ? GROUPED_PAGE_SIZE : PAGE_SIZE;
}

function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const productRequestVersion = useRef(0);

  useEffect(
    () => subscribeCatalogue(() => setRetryKey((current) => current + 1)),
    [],
  );

  const selectedCategory = searchParams.get("category") || "all";
  const requestedModel = searchParams.get("model")?.toUpperCase();
  const selectedModel =
    selectedCategory === GROUPED_CATEGORY_SLUG &&
    MODEL_GROUPS.some((group) => group.code === requestedModel)
      ? requestedModel
      : "ALL";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        const nextCategories = await getCatalogueCategories();
        if (!cancelled) setCategories(nextCategories);
      } catch (error) {
        if (!cancelled) console.error(error);
      }
    };
    void fetchCategories();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  useEffect(() => {
    let cancelled = false;
    const requestVersion = productRequestVersion.current + 1;
    productRequestVersion.current = requestVersion;
    const fetchProducts = async () => {
      setLoading(true);
      setLoadingMore(false);
      setLoadError("");
      try {
        const params = { page: 1, limit: pageSizeFor(selectedCategory) };
        if (selectedCategory !== "all") params.category = selectedCategory;
        if (debouncedSearch) params.search = debouncedSearch;
        const result = await getCatalogueProducts(params);
        if (cancelled || requestVersion !== productRequestVersion.current) return;
        setProducts(result.products);
        setPagination(result.pagination);
      } catch (error) {
        if (!cancelled && requestVersion === productRequestVersion.current) {
          console.error(error);
          setProducts([]);
          setPagination({ page: 1, pages: 0, total: 0 });
          setLoadError("The catalogue could not connect. Please try again.");
        }
      } finally {
        if (
          !cancelled &&
          requestVersion === productRequestVersion.current
        ) {
          setLoading(false);
        }
      }
    };
    void fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, debouncedSearch, retryKey]);

  const handleShowMore = async () => {
    if (loadingMore || pagination.page >= pagination.pages) return;
    const requestVersion = productRequestVersion.current;
    setLoadingMore(true);
    setLoadError("");
    try {
      const params = {
        page: pagination.page + 1,
        limit: pageSizeFor(selectedCategory),
      };
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (debouncedSearch) params.search = debouncedSearch;
      const result = await getCatalogueProducts(params);
      if (requestVersion !== productRequestVersion.current) return;
      setProducts((currentProducts) => {
        const existingIds = new Set(
          currentProducts.map((product) => product.id),
        );
        return [
          ...currentProducts,
          ...result.products.filter(
            (product) => !existingIds.has(product.id),
          ),
        ];
      });
      setPagination(result.pagination);
    } catch (error) {
      if (requestVersion !== productRequestVersion.current) return;
      console.error(error);
      setLoadError("Could not load more products. Please try again.");
    } finally {
      if (requestVersion === productRequestVersion.current)
        setLoadingMore(false);
    }
  };

  const handleCategoryChange = (slug) => {
    if (slug === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: slug });
    }
    setMobileFilterOpen(false); // close mobile filter after selection
  };

  const handleModelChange = (code) => {
    const nextParams = { category: GROUPED_CATEGORY_SLUG };
    if (code !== "ALL") nextParams.model = code.toLowerCase();
    setSearchParams(nextParams);
  };

  const groupedModelProducts = MODEL_GROUPS.map((group) => ({
    ...group,
    products: products.filter((product) => {
      if (product.model_group) return product.model_group === group.code;
      const skuPrefix = product.sku?.split("-")[0]?.toUpperCase();
      return skuPrefix === group.code;
    }),
  }));
  const visibleModelGroups = groupedModelProducts.filter(
    (group) =>
      group.products.length > 0 &&
      (selectedModel === "ALL" || group.code === selectedModel),
  );
  const selectedCategoryData = categories.find(
    (category) => category.slug === selectedCategory,
  );
  const selectedModelData = MODEL_GROUPS.find(
    (group) => group.code === selectedModel,
  );
  const collectionName = selectedModelData?.name || selectedCategoryData?.name;
  const seoTitle = collectionName
    ? `${collectionName} | Trophy Manufacturer in Jalandhar`
    : `Trophies & Awards Catalogue | ${SITE_NAME}`;
  const seoDescription = collectionName
    ? selectedCategoryData?.description && !selectedModelData
      ? `${selectedCategoryData.description} Browse original Delta Industries designs for custom branding and bulk orders.`
      : `Browse customizable ${collectionName.toLowerCase()} from Delta Industries, Jalandhar. Explore original designs for bulk orders, recognition and award ceremonies.`
    : "Browse customizable trophies, cups, plaques, corporate awards, mementos, medals and trophy accessories from Delta Industries, Jalandhar.";
  const canonicalParams = new URLSearchParams();
  if (selectedCategory !== "all")
    canonicalParams.set("category", selectedCategory);
  if (selectedModel !== "ALL")
    canonicalParams.set("model", selectedModel.toLowerCase());
  const canonicalPath = `/collections${canonicalParams.size ? `?${canonicalParams}` : ""}`;

  return (
    <div className="bg-darkbg min-h-screen pt-24">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        noindex={Boolean(debouncedSearch)}
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-gold text-xs tracking-[0.4em] uppercase mb-2">
            Our Products
          </p>
          <h1 className="text-white text-4xl font-bold">
            {collectionName || "Trophies & Awards Catalogue"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/45">
            {selectedModelData?.description ||
              selectedCategoryData?.description ||
              "Explore our complete range of customizable trophies, awards, mementos, medals and accessories."}
          </p>
        </div>

        {/* Search + Mobile Filter Button Row */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 md:w-96 md:flex-none bg-white/5 border border-gold/20 rounded px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
          />

          {/* Mobile Filter Button — only shows on mobile */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-2 border border-gold/30 text-gold px-4 py-3 text-xs tracking-widest uppercase hover:border-gold transition-colors"
          >
            ☰ Filter
            {selectedCategory !== "all" && (
              <span className="bg-gold text-darkbg text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                1
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filter Dropdown */}
        {mobileFilterOpen && (
          <div className="md:hidden border border-gold/20 bg-darkbg mb-6 p-4">
            <p className="text-gold text-xs tracking-widest uppercase mb-3 font-semibold">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              <Link
                to="/collections"
                onClick={() => handleCategoryChange("all")}
                className={`text-left px-3 py-2 text-sm tracking-wider uppercase transition-colors ${
                  selectedCategory === "all"
                    ? "text-gold border-l-2 border-gold pl-3"
                    : "text-white/50 hover:text-gold"
                }`}
              >
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/collections?category=${encodeURIComponent(category.slug)}`}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`text-left px-3 py-2 text-sm tracking-wider uppercase transition-colors ${
                    selectedCategory === category.slug
                      ? "text-gold border-l-2 border-gold pl-3"
                      : "text-white/50 hover:text-gold"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar — hidden on mobile */}
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-white/30 tracking-widest uppercase text-sm">
                  Loading...
                </p>
              </div>
            ) : loadError && products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <p className="text-white/40 tracking-wider text-sm">
                  {loadError}
                </p>
                <button
                  type="button"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className="border border-gold/30 px-5 py-2 text-gold text-xs tracking-widest uppercase hover:border-gold transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-white/30 tracking-widest uppercase text-sm">
                  No products found
                </p>
              </div>
            ) : (
              <>
                <p className="text-white/30 text-sm mb-6">
                  Showing {products.length} of {pagination.total} products
                  {selectedCategory !== "all" && (
                    <button
                      onClick={() => handleCategoryChange("all")}
                      className="ml-3 text-gold text-xs underline"
                    >
                      Clear filter
                    </button>
                  )}
                </p>
                {selectedCategory === GROUPED_CATEGORY_SLUG ? (
                  <div>
                    <div
                      className="flex flex-wrap gap-2 mb-10"
                      role="group"
                      aria-label="Filter award types"
                    >
                      <Link
                        to={`/collections?category=${GROUPED_CATEGORY_SLUG}`}
                        onClick={() => handleModelChange("ALL")}
                        aria-pressed={selectedModel === "ALL"}
                        className={`border px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
                          selectedModel === "ALL"
                            ? "border-gold bg-gold text-darkbg"
                            : "border-gold/30 text-gold hover:border-gold"
                        }`}
                      >
                        All ({products.length})
                      </Link>
                      {groupedModelProducts.map((group) => (
                        <Link
                          key={group.code}
                          to={`/collections?category=${GROUPED_CATEGORY_SLUG}&model=${group.code.toLowerCase()}`}
                          onClick={() => handleModelChange(group.code)}
                          aria-pressed={selectedModel === group.code}
                          className={`border px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
                            selectedModel === group.code
                              ? "border-gold bg-gold text-darkbg"
                              : "border-gold/30 text-gold hover:border-gold"
                          }`}
                        >
                          {group.name} ({group.products.length})
                        </Link>
                      ))}
                    </div>

                    <div className="flex flex-col gap-14">
                      {visibleModelGroups.map((group, groupIndex) => (
                        <section
                          key={group.code}
                          id={`model-group-${group.code.toLowerCase()}`}
                          className="scroll-mt-28"
                          aria-labelledby={`model-heading-${group.code.toLowerCase()}`}
                        >
                          <div className="flex items-end justify-between gap-4 mb-5 border-b border-gold/20 pb-3">
                            <div>
                              <p className="text-gold/60 text-[10px] tracking-[0.25em] uppercase mb-1">
                                {group.description}
                              </p>
                              <h2
                                id={`model-heading-${group.code.toLowerCase()}`}
                                className="text-white text-xl md:text-2xl font-semibold"
                              >
                                {group.name}
                              </h2>
                            </div>
                            <p className="text-white/30 text-xs shrink-0">
                              {group.products.length} products
                            </p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {group.products.map((product, productIndex) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                priority={groupIndex === 0 && productIndex < 3}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                      {visibleModelGroups.length === 0 && (
                        <p className="text-white/30 tracking-wider text-sm py-12 text-center">
                          No products found in this award type.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        priority={index < 3}
                      />
                    ))}
                  </div>
                )}
                {loadError && (
                  <p
                    className="text-center text-red-400/80 text-sm mt-6"
                    role="alert"
                  >
                    {loadError}
                  </p>
                )}
                {pagination.page < pagination.pages && (
                  <div className="flex justify-center mt-10">
                    <button
                      type="button"
                      onClick={handleShowMore}
                      disabled={loadingMore}
                      className="min-w-44 border border-gold/40 px-7 py-3 text-gold text-xs font-semibold tracking-[0.2em] uppercase hover:bg-gold hover:text-darkbg transition-colors disabled:cursor-wait disabled:opacity-50"
                    >
                      {loadingMore ? "Loading..." : "Show More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shop;
