export const SITE_URL = "https://www.deltatrophies.com";
export const SITE_NAME = "Delta Industries";
export const DEFAULT_SOCIAL_IMAGE =
  "https://res.cloudinary.com/gufssbcd/image/upload/c_fill,f_auto,q_auto:best,w_1200,h_630/v1788566868/deltatrophies/gallery/factory/AA%20Welcome.jpg";

export const STATIC_PAGE_SEO = {
  "": {
    title:
      "Custom Trophies & Awards Manufacturer in Jalandhar | Delta Industries",
    description:
      "Explore customizable trophy cups, sports trophies, corporate awards, mementos, plaques, medals and accessories from Delta Industries, Jalandhar.",
    canonicalPath: "/",
  },
  collections: {
    title: "Trophies & Awards Catalogue | Delta Industries",
    description:
      "Browse customizable trophies, cups, plaques, corporate awards, mementos, medals and trophy accessories from Delta Industries, Jalandhar.",
    canonicalPath: "/collections",
  },
  heritage: {
    title: "Our Heritage | Trophy Manufacturer Since 1998 | Delta Industries",
    description:
      "Discover the history of Delta Industries, a Jalandhar trophy and awards manufacturer established in 1998.",
    canonicalPath: "/heritage",
  },
  gallery: {
    title: "Trophy Factory & Events Gallery | Delta Industries",
    description:
      "View the Delta Industries factory, events and trophy collection gallery from our manufacturing team in Jalandhar, Punjab.",
    canonicalPath: "/gallery",
  },
  distributors: {
    title: "Find Delta Industries Trophy Distributors",
    description:
      "Find authorised Delta Industries trophy distributors in Jalandhar, Amritsar, Ludhiana, Delhi, Bathinda, Muzaffarnagar and Sri Ganganagar.",
    canonicalPath: "/distributors",
  },
  contact: {
    title: "Contact Delta Industries | Trophy Manufacturer in Jalandhar",
    description:
      "Contact Delta Industries for custom trophy orders, bulk enquiries and dealership information in Jalandhar, Punjab.",
    canonicalPath: "/contact",
  },
  "bulk-enquiry": {
    title: "Bulk Trophy Enquiry | Request a Quotation | Delta Industries",
    description:
      "Send a qualified bulk trophy and awards enquiry to Delta Industries. Suitable for institutions, corporate events, sports events and resellers.",
    canonicalPath: "/bulk-enquiry",
  },
};

export function productPath(product) {
  return `/products/${encodeURIComponent(product.id)}/${encodeURIComponent(product.slug)}`;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeXml(value) {
  return escapeHtml(value).replace(/&#39;/g, "&apos;");
}

export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
