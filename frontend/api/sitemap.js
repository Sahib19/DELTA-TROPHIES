import {
  escapeXml,
  productPath,
  SITE_URL,
  STATIC_PAGE_SEO,
} from "./_seo-shared.js";
import { loadCatalogue } from "./_catalogue.js";

function sitemapEntry({ path, lastModified, images = [] }) {
  const lastmod = lastModified
    ? `<lastmod>${escapeXml(new Date(lastModified).toISOString())}</lastmod>`
    : "";
  const imageMarkup = images
    .filter((image) => image.url)
    .map(
      (image) =>
        `<image:image><image:loc>${escapeXml(image.url)}</image:loc><image:title>${escapeXml(image.title)}</image:title></image:image>`,
    )
    .join("");
  return `<url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod}${imageMarkup}</url>`;
}

export default async function handler(_request, response) {
  const entries = Object.values(STATIC_PAGE_SEO).map(({ canonicalPath }) =>
    sitemapEntry({ path: canonicalPath }),
  );
  try {
    const catalogue = await loadCatalogue();
    for (const category of catalogue.categories) {
      entries.push(
        sitemapEntry({
          path: `/collections?category=${encodeURIComponent(category.slug)}`,
        }),
      );
      if (category.slug === "la-aca-ra-f-models") {
        for (const model of ["LA", "F", "RA", "ACA"]) {
          entries.push(
            sitemapEntry({
              path: `/collections?category=${encodeURIComponent(category.slug)}&model=${model.toLowerCase()}`,
            }),
          );
        }
      }
    }
    for (const product of catalogue.products) {
      if (!product.id || !product.slug) continue;
      entries.push(
        sitemapEntry({
          path: productPath(product),
          lastModified: product.updated_at,
          images: (product.images || []).map((url) => ({
            url,
            title: product.image_alt || product.name,
          })),
        }),
      );
    }
  } catch (error) {
    console.error(
      "Catalogue sitemap unavailable:",
      error instanceof Error ? error.message : error,
    );
    response.setHeader("Cache-Control", "no-store");
    response.status(503).send("Sitemap temporarily unavailable");
    return;
  }

  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600",
  );
  response
    .status(200)
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join("\n")}\n</urlset>`,
    );
}
