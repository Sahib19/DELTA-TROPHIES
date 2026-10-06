import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import API from "../api/axios";
import {
  getCatalogueProduct,
  getCatalogueProducts,
  subscribeCatalogue,
} from "../api/catalogue";
import getImageUrl, { getOptimizedImageUrl } from "../utils/getImageUrl";
import { jsonLd, productPath, SITE_NAME, SITE_URL } from "../config/seo";
import ProductCard from "../components/ProductCard";
import ProductImageLightbox from "../components/ProductImageLightbox";

function restoreOriginalImage(event, path) {
  const originalImage = getImageUrl(path);
  if (originalImage && event.currentTarget.src !== originalImage) {
    event.currentTarget.src = originalImage;
  }
}

function ProductDetail() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productNavigation, setProductNavigation] = useState({
    previous: null,
    next: null,
  });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const closeImagePreview = useCallback(() => setImagePreviewOpen(false), []);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [catalogueRevision, setCatalogueRevision] = useState(0);

  useEffect(
    () =>
      subscribeCatalogue(() =>
        setCatalogueRevision((current) => current + 1),
      ),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      setProduct(null);
      setProductNavigation({ previous: null, next: null });
      setRelatedProducts([]);
      setSelectedImage(0);
      setImagePreviewOpen(false);
      setSubmitted(false);
      setSubmitError("");
      try {
        const result = await getCatalogueProduct(id);
        if (cancelled || !result) return;
        setProduct(result.product);
        setProductNavigation(
          result.navigation || { previous: null, next: null },
        );
      } catch (error) {
        if (!cancelled) console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id, catalogueRevision]);

  useEffect(() => {
    // React Router reuses this page when moving between product URLs. Wait for
    // the new product before correcting its slug, or the previous product can
    // redirect the click back to its own URL.
    if (!product || product.id !== id) return;
    const expectedPath = productPath(product);
    if (slug !== product.slug) navigate(expectedPath, { replace: true });
  }, [id, navigate, product, slug]);

  useEffect(() => {
    if (!product?.category_slug) return undefined;
    let cancelled = false;
    const fetchRelated = async () => {
      try {
        const result = await getCatalogueProducts({
          category: product.category_slug,
          page: 1,
          limit: 5,
        });
        if (!cancelled)
          setRelatedProducts(
          result.products
            .filter((item) => item.id !== product.id)
            .slice(0, 4),
        );
      } catch (error) {
        if (!cancelled) console.error(error);
      }
    };
    void fetchRelated();
    return () => {
      cancelled = true;
    };
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      await API.post("/inquiries", {
        ...formData,
        product_id: product.id,
      });
      setSubmitted(true);
    } catch (requestError) {
      setSubmitError(
        requestError.response?.data?.error ||
          "Unable to submit enquiry. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (product && product.id !== id))
    return (
      <div className="bg-darkbg min-h-screen flex items-center justify-center">
        <p className="text-white/30 tracking-widest uppercase text-sm">
          Loading...
        </p>
      </div>
    );

  if (!product)
    return (
      <div className="bg-darkbg min-h-screen flex items-center justify-center">
        <Helmet>
          <title>Product Not Found | Delta Industries</title>
          <meta name="robots" content="noindex,follow" />
        </Helmet>
        <p className="text-white/30 tracking-widest uppercase text-sm">
          Product not found
        </p>
      </div>
    );

  const canonicalPath = productPath(product);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const primaryImage = getImageUrl(product.images?.[0]);
  const seoDescription = product.seo_description;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    url: canonicalUrl,
    name: product.name,
    description: seoDescription,
    image: product.images?.map(getImageUrl).filter(Boolean) ?? [],
    sku: product.sku || undefined,
    category: product.category_name || undefined,
    material: product.material || undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    manufacturer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: `${SITE_URL}/collections`,
      },
      ...(product.category_name && product.category_slug
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category_name,
              item: `${SITE_URL}/collections?category=${encodeURIComponent(product.category_slug)}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category_name && product.category_slug ? 4 : 3,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="bg-darkbg min-h-screen pt-24">
      <Helmet>
        <title>
          {product.seo_title || `${product.name} | Delta Industries`}
        </title>
        <meta name="description" content={seoDescription} />
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        {primaryImage && <meta property="og:image" content={primaryImage} />}
        {primaryImage && (
          <meta property="og:image:alt" content={product.image_alt} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.name} />
        <meta name="twitter:description" content={seoDescription} />
        {primaryImage && <meta name="twitter:image" content={primaryImage} />}
        {primaryImage && (
          <meta name="twitter:image:alt" content={product.image_alt} />
        )}
        <script type="application/ld+json">{jsonLd(productSchema)}</script>
        <script type="application/ld+json">{jsonLd(breadcrumbSchema)}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/30 text-xs tracking-wider uppercase mb-10">
          <Link to="/" className="hover:text-gold transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/collections" className="hover:text-gold transition-colors">
            Collections
          </Link>
          {product.category_name && product.category_slug && (
            <>
              <span>/</span>
              <Link
                to={`/collections?category=${encodeURIComponent(product.category_slug)}`}
                className="hover:text-gold transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gold">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <button
                type="button"
                onClick={() => setImagePreviewOpen(true)}
                aria-label={`View larger image of ${product.name}`}
                className="group relative mb-4 flex h-[420px] w-full cursor-zoom-in items-center justify-center border border-gold/20 bg-white transition-colors hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:h-[520px] lg:h-[600px]"
              >
                <img
                  src={getOptimizedImageUrl(product.images[selectedImage], {
                    width: 1600,
                    height: 1600,
                  })}
                  alt={product.image_alt || product.name}
                  width="1600"
                  height="1600"
                  decoding="async"
                  fetchPriority="high"
                  onError={(event) =>
                    restoreOriginalImage(event, product.images[selectedImage])
                  }
                  className="h-full w-full object-contain p-4"
                />
                <span className="absolute bottom-4 right-4 border border-gold/50 bg-darkbg/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-gold transition-colors group-hover:border-gold">
                  View larger ↗
                </span>
              </button>
            ) : (
              <div className="mb-4 flex h-[420px] items-center justify-center border border-gold/20 bg-white sm:h-[520px] lg:h-[600px]">
                <p className="text-darkbg/30 text-sm">No Image Available</p>
              </div>
            )}

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 border bg-white overflow-hidden ${
                      selectedImage === index
                        ? "border-gold"
                        : "border-gold/20 hover:border-gold/50"
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(img, {
                        width: 200,
                        height: 200,
                      })}
                      alt={`${product.image_alt || product.name} - view ${index + 1}`}
                      width="200"
                      height="200"
                      loading="lazy"
                      decoding="async"
                      onError={(event) => restoreOriginalImage(event, img)}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info + Enquiry Form */}
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">
              {product.category_name}
            </p>
            <h1 className="text-white text-3xl font-bold mb-2">
              {product.name}
            </h1>
            {product.sku && (
              <p className="text-white/30 text-xs tracking-wider mb-6">
                SKU: {product.sku}
              </p>
            )}

            {(productNavigation.previous || productNavigation.next) && (
              <nav
                aria-label="Browse trophies"
                className="grid grid-cols-2 gap-3 mb-8"
              >
                {productNavigation.previous ? (
                  <a
                    href={productPath(productNavigation.previous)}
                    aria-label={`Previous trophy: ${productNavigation.previous.name}`}
                    className="group w-full cursor-pointer border border-gold/30 px-4 py-3 text-left transition-colors hover:border-gold hover:bg-gold/10"
                  >
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-gold">
                      ← Previous Trophy
                    </span>
                    <span className="mt-1 block truncate text-sm text-white/70 group-hover:text-white">
                      {productNavigation.previous.name}
                    </span>
                  </a>
                ) : (
                  <span aria-hidden="true" />
                )}
                {productNavigation.next && (
                  <a
                    href={productPath(productNavigation.next)}
                    aria-label={`Next trophy: ${productNavigation.next.name}`}
                    className="group w-full cursor-pointer border border-gold/30 bg-gold/5 px-4 py-3 text-right transition-colors hover:border-gold hover:bg-gold/10"
                  >
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-gold">
                      Next Trophy →
                    </span>
                    <span className="mt-1 block truncate text-sm text-white/70 group-hover:text-white">
                      {productNavigation.next.name}
                    </span>
                  </a>
                )}
              </nav>
            )}
            {product.description && (
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                {product.description}
              </p>
            )}
            {product.material && (
              <div className="border border-gold/20 px-4 py-3 mb-8 inline-block">
                <p className="text-white/30 text-xs tracking-wider uppercase">
                  Material:{" "}
                  <span className="text-gold">{product.material}</span>
                </p>
              </div>
            )}

            {/* Enquiry Form */}
            <div className="border border-gold/20 p-6">
              <h3 className="text-white text-lg font-bold mb-4">
                Enquire About This Product
              </h3>

              {submitted ? (
                <div className="text-center py-6">
                  <p className="text-gold text-2xl mb-2">✓</p>
                  <p className="text-white">Enquiry submitted!</p>
                  <p className="text-white/50 text-sm mt-1">
                    We'll contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {submitError && (
                    <p className="text-red-400 text-sm">{submitError}</p>
                  )}
                  <div>
                    <label htmlFor="enquiry-name" className="sr-only">
                      Your Name
                    </label>
                    <input
                      id="enquiry-name"
                      name="name"
                      type="text"
                      placeholder="Your Name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full bg-white/5 border border-gold/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="enquiry-email" className="sr-only">
                      Email Address
                    </label>
                    <input
                      id="enquiry-email"
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="w-full bg-white/5 border border-gold/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="enquiry-phone" className="sr-only">
                      Phone Number
                    </label>
                    <input
                      id="enquiry-phone"
                      name="phone"
                      type="tel"
                      placeholder="Phone Number"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                      className="w-full bg-white/5 border border-gold/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="enquiry-message" className="sr-only">
                      Your message (optional)
                    </label>
                    <textarea
                      id="enquiry-message"
                      name="message"
                      placeholder="Your message (optional)"
                      autoComplete="off"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      rows={3}
                      className="w-full bg-white/5 border border-gold/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gold text-darkbg font-bold py-3 tracking-widest uppercase text-sm hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Send Enquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section
            className="mt-20 border-t border-gold/20 pt-10"
            aria-labelledby="related-products"
          >
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold">
              More to explore
            </p>
            <h2
              id="related-products"
              className="mb-7 text-2xl font-bold text-white"
            >
              Related {product.category_name}
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
      {imagePreviewOpen && product.images?.[selectedImage] && (
        <ProductImageLightbox
          image={product.images[selectedImage]}
          alt={product.image_alt || product.name}
          name={product.name}
          onClose={closeImagePreview}
        />
      )}
    </div>
  );
}

export default ProductDetail;
