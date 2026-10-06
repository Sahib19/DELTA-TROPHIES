import { splitAccessories } from "./splitAccessories";

const FALLBACK_CATALOGUE_URL = "/catalogue.json";
const DEFAULT_REMOTE_CATALOGUE_URL =
  "https://res.cloudinary.com/gufssbcd/raw/upload/deltatrophies/catalog/catalogue.json";
const REMOTE_CATALOGUE_URL =
  import.meta.env.VITE_CATALOGUE_URL || DEFAULT_REMOTE_CATALOGUE_URL;
const CACHE_KEY = "delta-public-catalogue-v1";

const listeners = new Set();
let currentCatalogue = readCachedCatalogue();
let initialLoadPromise;
let refreshPromise;
let fallbackRefreshPromise;

function isCatalogue(value) {
  return (
    value?.schema_version === 1 &&
    typeof value.version === "string" &&
    Array.isArray(value.categories) &&
    Array.isArray(value.products)
  );
}

function readCachedCatalogue() {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return isCatalogue(value) ? splitAccessories(value) : null;
  } catch {
    return null;
  }
}

function storeCatalogue(catalogue) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(catalogue));
  } catch {
    // The in-memory catalogue still works when storage is unavailable or full.
  }
}

function acceptCatalogue(catalogue) {
  if (!isCatalogue(catalogue)) throw new Error("Invalid catalogue snapshot");
  const currentGeneratedAt = Date.parse(currentCatalogue?.generated_at || "");
  const nextGeneratedAt = Date.parse(catalogue.generated_at || "");
  if (
    currentCatalogue &&
    Number.isFinite(currentGeneratedAt) &&
    Number.isFinite(nextGeneratedAt) &&
    nextGeneratedAt < currentGeneratedAt
  ) {
    return currentCatalogue;
  }
  const changed = currentCatalogue?.version !== catalogue.version;
  currentCatalogue = splitAccessories(catalogue);
  storeCatalogue(catalogue);
  if (changed) listeners.forEach((listener) => listener(currentCatalogue));
  return currentCatalogue;
}

async function fetchCatalogue(url, cache) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache,
  });
  if (!response.ok) throw new Error(`Catalogue responded ${response.status}`);
  return acceptCatalogue(await response.json());
}

function refreshRemoteCatalogue() {
  refreshPromise ??= fetchCatalogue(REMOTE_CATALOGUE_URL, "no-cache").finally(
    () => {
      refreshPromise = undefined;
    },
  );
  return refreshPromise;
}

function refreshFallbackCatalogue() {
  fallbackRefreshPromise ??= fetchCatalogue(
    FALLBACK_CATALOGUE_URL,
    "default",
  ).finally(() => {
    fallbackRefreshPromise = undefined;
  });
  return fallbackRefreshPromise;
}

export async function getCatalogue() {
  if (currentCatalogue) {
    void refreshRemoteCatalogue().catch(() => undefined);
    void refreshFallbackCatalogue().catch(() => undefined);
    return currentCatalogue;
  }

  initialLoadPromise ??= Promise.any([
    refreshFallbackCatalogue(),
    refreshRemoteCatalogue(),
  ]).finally(() => {
    initialLoadPromise = undefined;
  });
  return initialLoadPromise;
}

export function subscribeCatalogue(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getCatalogueCategories() {
  return (await getCatalogue()).categories;
}

export async function getCatalogueProducts(params = {}) {
  const catalogue = await getCatalogue();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || 24);
  const category = params.category;
  const search = String(params.search || "").trim().toLowerCase();
  const inStock = params.in_stock;
  const filtered = catalogue.products.filter((product) => {
    if (category && product.category_slug !== category) return false;
    if (inStock !== undefined && product.in_stock !== inStock) return false;
    if (!search) return true;
    return [
      product.name,
      product.sku,
      product.description,
      product.material,
      product.category_name,
      ...(product.search_terms || []),
    ].some((value) => String(value || "").toLowerCase().includes(search));
  });
  const start = (page - 1) * limit;

  return {
    products: filtered.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      pages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / limit),
    },
  };
}

function navigationItem(product) {
  if (!product) return null;
  return { id: product.id, name: product.name, slug: product.slug };
}

export async function getCatalogueProduct(id) {
  const catalogue = await getCatalogue();
  const product = catalogue.products.find((item) => item.id === id);
  if (!product) return null;
  const categoryProducts = catalogue.products.filter(
    (item) => item.category_id === product.category_id,
  );
  const index = categoryProducts.findIndex((item) => item.id === product.id);

  return {
    product,
    navigation: {
      previous: navigationItem(categoryProducts[index - 1]),
      next: navigationItem(categoryProducts[index + 1]),
    },
  };
}
