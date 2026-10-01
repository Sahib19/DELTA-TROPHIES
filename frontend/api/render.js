/* global process */

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_SOCIAL_IMAGE,
  escapeHtml,
  jsonLd,
  productPath,
  SITE_NAME,
  SITE_URL,
  STATIC_PAGE_SEO,
} from "./_seo-shared.js";
import { findCatalogueProduct, loadCatalogue } from "./_catalogue.js";

const shellCandidates = [
  path.join(process.cwd(), "dist", "index.html"),
  path.join(process.cwd(), "frontend", "dist", "index.html"),
];

let shellPromise;

async function loadShell() {
  shellPromise ??= (async () => {
    for (const candidate of shellCandidates) {
      try {
        return await readFile(candidate, "utf8");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    throw new Error(
      "Built frontend shell was not included in the SEO renderer",
    );
  })();
  return shellPromise;
}

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-192.png`,
    foundingDate: "1998",
    telephone: "+919115679399",
    email: "gsbedi_99@yahoo.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jalandhar",
      addressRegion: "Punjab",
      addressCountry: "IN",
    },
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
  };
}

function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${items.at(-1)?.item || SITE_URL}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function pageGraph(metadata, extraNodes = []) {
  const canonicalUrl = `${SITE_URL}${metadata.canonicalPath}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      websiteNode(),
      {
        "@type": metadata.pageType || "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: metadata.title,
        description: metadata.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
      },
      ...extraNodes,
    ],
  };
}

function headMarkup(metadata, structuredData) {
  const canonicalUrl = `${SITE_URL}${metadata.canonicalPath}`;
  const image = metadata.image || DEFAULT_SOCIAL_IMAGE;
  const socialTitle = metadata.socialTitle || metadata.title;
  const robots = metadata.noindex
    ? "noindex,follow"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  return `
    <title data-rh="true">${escapeHtml(metadata.title)}</title>
    <meta data-rh="true" name="description" content="${escapeHtml(metadata.description)}" />
    <meta data-rh="true" name="robots" content="${robots}" />
    <link data-rh="true" rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta data-rh="true" property="og:type" content="${metadata.ogType || "website"}" />
    <meta data-rh="true" property="og:locale" content="en_IN" />
    <meta data-rh="true" property="og:site_name" content="${SITE_NAME}" />
    <meta data-rh="true" property="og:title" content="${escapeHtml(socialTitle)}" />
    <meta data-rh="true" property="og:description" content="${escapeHtml(metadata.description)}" />
    <meta data-rh="true" property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta data-rh="true" property="og:image" content="${escapeHtml(image)}" />
    <meta data-rh="true" property="og:image:alt" content="${escapeHtml(metadata.imageAlt || metadata.title)}" />
    <meta data-rh="true" name="twitter:card" content="summary_large_image" />
    <meta data-rh="true" name="twitter:title" content="${escapeHtml(socialTitle)}" />
    <meta data-rh="true" name="twitter:description" content="${escapeHtml(metadata.description)}" />
    <meta data-rh="true" name="twitter:image" content="${escapeHtml(image)}" />
    <meta data-rh="true" name="twitter:image:alt" content="${escapeHtml(metadata.imageAlt || metadata.title)}" />
    <script data-rh="true" type="application/ld+json">${jsonLd(structuredData)}</script>`;
}

function renderShell(shell, metadata, structuredData) {
  const withoutPageMetadata = shell
    .replace(/\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+name="description"[^>]*\/?>/i, "");
  return withoutPageMetadata.replace(
    "</head>",
    `${headMarkup(metadata, structuredData)}\n  </head>`,
  );
}

function sendHtml(response, status, html, cacheControl) {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", cacheControl);
  response.status(status).send(html);
}

function redirect(response, location) {
  response.setHeader("Location", location);
  response.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  response.status(308).send("");
}

function productMetadata(product) {
  const canonicalPath = productPath(product);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const categoryPath = product.category_slug
    ? `/collections?category=${encodeURIComponent(product.category_slug)}`
    : "/collections";
  const metadata = {
    title: product.seo_title || `${product.name} | ${SITE_NAME}`,
    socialTitle: product.name,
    description: product.seo_description,
    canonicalPath,
    image: product.images?.[0],
    imageAlt: product.image_alt || product.name,
    ogType: "product",
    pageType: "ItemPage",
  };
  const productNode = {
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    url: canonicalUrl,
    name: product.name,
    description: product.seo_description,
    image: product.images || [],
    sku: product.sku || undefined,
    category: product.category_name || undefined,
    material: product.material || undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    manufacturer: { "@id": `${SITE_URL}/#organization` },
  };
  const breadcrumbs = breadcrumbNode([
    { name: "Home", item: SITE_URL },
    { name: "Collections", item: `${SITE_URL}/collections` },
    ...(product.category_name
      ? [{ name: product.category_name, item: `${SITE_URL}${categoryPath}` }]
      : []),
    { name: product.name, item: canonicalUrl },
  ]);
  return {
    metadata,
    structuredData: pageGraph(metadata, [productNode, breadcrumbs]),
  };
}

async function collectionMetadata(categorySlug, modelCode) {
  const base = STATIC_PAGE_SEO.collections;
  if (!categorySlug) {
    const metadata = { ...base, pageType: "CollectionPage" };
    return { metadata, structuredData: pageGraph(metadata) };
  }

  const catalogue = await loadCatalogue();
  const category = catalogue.categories.find(
    (item) => item.slug === categorySlug,
  );
  if (!category) return null;
  const modelNames = {
    LA: "Wooden & Acrylic Awards",
    F: "Frames",
    RA: "Resin Awards",
    ACA: "Acrylic & Resin Awards",
  };
  const selectedModel = modelCode
    ? modelNames[modelCode.toUpperCase()]
    : undefined;
  const name = selectedModel || category.name;
  const params = new URLSearchParams({ category: category.slug });
  if (selectedModel) params.set("model", modelCode.toLowerCase());
  const metadata = {
    title: `${name} | Trophy Manufacturer in Jalandhar`,
    description: selectedModel
      ? `Browse customizable ${name.toLowerCase()} from Delta Industries, Jalandhar. Explore original designs for bulk orders, recognition and award ceremonies.`
      : `${category.description} Browse original Delta Industries designs for custom branding and bulk orders.`,
    canonicalPath: `/collections?${params}`,
    pageType: "CollectionPage",
  };
  const breadcrumbs = breadcrumbNode([
    { name: "Home", item: SITE_URL },
    { name: "Collections", item: `${SITE_URL}/collections` },
    { name, item: `${SITE_URL}${metadata.canonicalPath}` },
  ]);
  return { metadata, structuredData: pageGraph(metadata, [breadcrumbs]) };
}

export default async function handler(request, response) {
  let shell;
  try {
    shell = await loadShell();
  } catch (error) {
    response
      .status(500)
      .send(error instanceof Error ? error.message : "SEO renderer failed");
    return;
  }

  const requestPath = (queryValue(request.query?.path) || "").replace(
    /^\/+|\/+$/g,
    "",
  );
  const segments = requestPath.split("/").filter(Boolean);

  try {
    if (segments[0] === "products" && segments[1]) {
      const product = findCatalogueProduct(await loadCatalogue(), segments[1]);
      const canonicalPath = productPath(product);
      if (segments[2] !== product.slug) {
        redirect(response, canonicalPath);
        return;
      }
      const { metadata, structuredData } = productMetadata(product);
      sendHtml(
        response,
        200,
        renderShell(shell, metadata, structuredData),
        "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      );
      return;
    }

    if (
      segments[0] === "collections" &&
      segments[1] &&
      /^[a-f\d]{24}$/i.test(segments[1])
    ) {
      const product = findCatalogueProduct(await loadCatalogue(), segments[1]);
      redirect(response, productPath(product));
      return;
    }

    if (requestPath === "collections") {
      const result = await collectionMetadata(
        queryValue(request.query?.category),
        queryValue(request.query?.model),
      );
      if (!result) {
        const metadata = {
          title: "Collection Not Found | Delta Industries",
          description: "The requested trophy collection could not be found.",
          canonicalPath: "/collections",
          noindex: true,
        };
        sendHtml(
          response,
          404,
          renderShell(shell, metadata, pageGraph(metadata)),
          "no-store",
        );
        return;
      }
      sendHtml(
        response,
        200,
        renderShell(shell, result.metadata, result.structuredData),
        "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
      );
      return;
    }

    if (requestPath.startsWith("admin")) {
      const metadata = {
        title: `Admin | ${SITE_NAME}`,
        description: "Delta Industries catalogue administration.",
        canonicalPath: "/admin",
        noindex: true,
      };
      sendHtml(
        response,
        200,
        renderShell(shell, metadata, pageGraph(metadata)),
        "no-store",
      );
      return;
    }

    const staticMetadata = STATIC_PAGE_SEO[requestPath];
    if (staticMetadata) {
      const metadata = { ...staticMetadata };
      const breadcrumbs =
        requestPath === ""
          ? []
          : [
              breadcrumbNode([
                { name: "Home", item: SITE_URL },
                {
                  name: metadata.title.split("|")[0].trim(),
                  item: `${SITE_URL}${metadata.canonicalPath}`,
                },
              ]),
            ];
      sendHtml(
        response,
        200,
        renderShell(shell, metadata, pageGraph(metadata, breadcrumbs)),
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      );
      return;
    }

    const metadata = {
      title: "Page Not Found | Delta Industries",
      description: "The requested page could not be found.",
      canonicalPath: "/",
      noindex: true,
    };
    sendHtml(
      response,
      404,
      renderShell(shell, metadata, pageGraph(metadata)),
      "no-store",
    );
  } catch (error) {
    const notFound = error?.status === 404;
    const metadata = {
      title: notFound
        ? "Product Not Found | Delta Industries"
        : "Catalogue Temporarily Unavailable",
      description: notFound
        ? "The requested product could not be found."
        : "The Delta Industries catalogue is temporarily unavailable. Please try again shortly.",
      canonicalPath: notFound ? "/collections" : `/${requestPath}`,
      noindex: true,
    };
    sendHtml(
      response,
      notFound ? 404 : 503,
      renderShell(shell, metadata, pageGraph(metadata)),
      "no-store",
    );
  }
}
