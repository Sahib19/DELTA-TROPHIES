/* global process */

import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CATALOGUE_URL =
  "https://res.cloudinary.com/gufssbcd/raw/upload/deltatrophies/catalog/catalogue.json";
const catalogueCandidates = [
  path.join(process.cwd(), "dist", "catalogue.json"),
  path.join(process.cwd(), "frontend", "dist", "catalogue.json"),
];

let cachedCatalogue;
let cacheExpiresAt = 0;

function validateCatalogue(value) {
  if (
    value?.schema_version !== 1 ||
    typeof value.version !== "string" ||
    !Array.isArray(value.categories) ||
    !Array.isArray(value.products)
  ) {
    throw new Error("Invalid catalogue snapshot");
  }
  return value;
}

async function loadFallbackCatalogue() {
  for (const candidate of catalogueCandidates) {
    try {
      return validateCatalogue(JSON.parse(await readFile(candidate, "utf8")));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("Built catalogue snapshot was not included");
}

export async function loadCatalogue() {
  if (cachedCatalogue && Date.now() < cacheExpiresAt) return cachedCatalogue;
  const catalogueUrl =
    process.env.CATALOGUE_URL ||
    process.env.VITE_CATALOGUE_URL ||
    DEFAULT_CATALOGUE_URL;

  try {
    const response = await fetch(catalogueUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Catalogue CDN responded ${response.status}`);
    cachedCatalogue = validateCatalogue(await response.json());
  } catch (error) {
    console.error(
      "Latest catalogue unavailable; using deployment snapshot:",
      error instanceof Error ? error.message : error,
    );
    cachedCatalogue = await loadFallbackCatalogue();
  }

  cacheExpiresAt = Date.now() + 60_000;
  return cachedCatalogue;
}

export function findCatalogueProduct(catalogue, id) {
  const product = catalogue.products.find((item) => item.id === id);
  if (product) return product;
  const error = new Error("Product not found");
  error.status = 404;
  throw error;
}
