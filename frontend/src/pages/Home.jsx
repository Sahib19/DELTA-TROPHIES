import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getCatalogueCategories,
  getCatalogueProducts,
  subscribeCatalogue,
} from "../api/catalogue";
import HeroVideo from "../components/HeroVideo";
import ProductCard from "../components/ProductCard";
import getImageUrl, { getOptimizedImageUrl } from "../utils/getImageUrl";
import { CONTACT } from "../config/contact";
import { SITE_NAME, SITE_URL } from "../config/seo";
import SeoHead from "../components/SeoHead";

const homeTitle =
  "Custom Trophies & Awards Manufacturer in Jalandhar | Delta Industries";
const homeDescription =
  "Explore customizable trophy cups, sports trophies, corporate awards, mementos, plaques, medals and accessories from Delta Industries, Jalandhar.";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon-192.png`,
  foundingDate: "1998",
  telephone: CONTACT.phone,
  email: CONTACT.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Jalandhar",
    addressRegion: "Punjab",
    addressCountry: "IN",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
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
    const fetchData = async () => {
      try {
        const [nextCategories, productResult] = await Promise.all([
          getCatalogueCategories(),
          getCatalogueProducts({ page: 1, limit: 6 }),
        ]);
        if (cancelled) return;
        setCategories(nextCategories);
        setFeaturedProducts(productResult.products);
      } catch (error) {
        if (!cancelled) console.error(error);
      }
    };
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [catalogueRevision]);

  return (
    <div className="bg-darkbg w-full min-h-screen text-white font-sans overflow-x-hidden selection:bg-gold/30 selection:text-white">
      <SeoHead
        title={homeTitle}
        description={homeDescription}
        canonicalPath="/"
        imageAlt="Delta Industries trophy manufacturing facility in Jalandhar"
        structuredData={[organizationSchema, websiteSchema]}
      />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Ambient Premium Glow Layer */}
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[150px] pointer-events-none z-10" />
        <div className="absolute bottom-1/4 right-10 w-[300px] h-[300px] bg-white/5 rounded-full blur-[120px] pointer-events-none z-10" />

        {/* Sequential Cloudinary-optimized hero videos */}
        <HeroVideo />
        {/* Big Background Typography */}
        <div className="absolute right-[-2%] bottom-[12%] select-none pointer-events-none hidden lg:block z-0">
          <h2
            className="text-[13vw] font-bold leading-none uppercase tracking-tighter text-transparent opacity-5"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}
          >
            CRAFT
          </h2>
        </div>

        {/* Centered hero content */}
        <div className="relative z-20 mx-auto w-full max-w-5xl px-6 pt-24 pb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mx-auto flex max-w-4xl flex-col items-center"
            >
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.2em" }}
                animate={{ opacity: 1, letterSpacing: "0.4em" }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-yellow-400 text-xs font-semibold uppercase mb-6 inline-block bg-gold/10 px-4 py-1.5 rounded-full border border-gold/20 backdrop-blur-sm"
              >
                Delta Industries · Est. 1998
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 font-serif [text-shadow:0_2px_12px_rgba(0,0,0,0.8)]"
              >
                Crafting{" "}
                <span className="text-yellow-400 italic font-normal">
                  excellence,
                </span>
                <br />
                Honouring achievements
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mx-auto max-w-2xl text-white text-base md:text-lg leading-relaxed mb-10 font-light [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]"
              >
                Crafting symbols of achievement since 1998. From trophy cups and
                sports awards to corporate mementos, Delta creates the moments
                that organisations remember.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex justify-center gap-4 flex-wrap"
              >
                <Link
                  to="/collections"
                  className="group relative bg-yellow-400 text-darkbg font-bold px-8 py-4 tracking-widest uppercase text-xs transition-all duration-300 shadow-xl shadow-gold/10 hover:shadow-gold/20 hover:-translate-y-0.5"
                >
                  Explore Collections →
                </Link>
                <Link
                  to="/contact"
                  className="border border-white/20 text-white font-medium px-8 py-4 tracking-widest uppercase text-xs backdrop-blur-md bg-white/5 hover:bg-white/10 hover:border-gold hover:text-gold transition-all duration-300 hover:-translate-y-0.5"
                >
                  Request Custom Design
                </Link>
              </motion.div>
            </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-2 pointer-events-none"
        >
          <p className="text-white/30 text-xs tracking-widest uppercase">
            Scroll
          </p>
          <div className="w-px h-8 bg-gradient-to-b from-gold/50 to-transparent" />
        </motion.div>
      </section>

      {/* Categories Section */}
      {/* Categories Carousel */}
      <div className="bg-darkbg w-full">
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-gold text-xs tracking-[0.4em] uppercase mb-2">
                Our Collections
              </p>
              <h2 className="text-white text-4xl font-bold">
                Browse by Category
              </h2>
            </div>
            <Link
              to="/collections"
              className="text-gold text-xs tracking-widest uppercase hover:text-gold/70 transition-colors hidden md:block"
            >
              View All →
            </Link>
          </div>

          {/* Carousel Track */}
          <div className="relative">
            <div
              id="category-carousel"
              className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/collections?category=${category.slug}`}
                  className="group relative flex-shrink-0 w-64 h-80 overflow-hidden border border-gold/20 hover:border-gold transition-all duration-300 bg-white flex flex-col"
                >
                  {/* Photo area */}
                  <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(category.thumbnail, {
                        width: 700,
                        height: 700,
                      })}
                      alt={category.name}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        const originalImage = getImageUrl(category.thumbnail);
                        if (
                          originalImage &&
                          event.currentTarget.src !== originalImage
                        ) {
                          event.currentTarget.src = originalImage;
                        }
                      }}
                      className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Solid dark label bar — not a gradient over the photo */}
                  <div className="bg-darkbg border-t border-gold/20 px-5 py-4">
                    <p className="text-white group-hover:text-gold text-sm font-semibold tracking-wider uppercase transition-colors duration-300">
                      {category.name}
                    </p>
                    <p className="text-gold text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 tracking-widest">
                      Explore →
                    </p>
                  </div>

                  {/* Corner accents on photo area only */}
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gold/40 group-hover:border-gold transition-colors duration-300 z-10" />
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gold/40 group-hover:border-gold transition-colors duration-300 z-10" />
                </Link>
              ))}
            </div>

            {/* Left/Right scroll buttons */}
            <button
              onClick={() =>
                document
                  .getElementById("category-carousel")
                  .scrollBy({ left: -280, behavior: "smooth" })
              }
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-darkbg border border-gold/30 text-gold items-center justify-center hover:bg-gold hover:text-darkbg transition-colors z-10"
            >
              ←
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("category-carousel")
                  .scrollBy({ left: 280, behavior: "smooth" })
              }
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-darkbg border border-gold/30 text-gold items-center justify-center hover:bg-gold hover:text-darkbg transition-colors z-10"
            >
              →
            </button>
          </div>
        </section>
      </div>
      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-20">
        <div className="text-center md:text-left mb-16">
          <p className="text-gold text-xs tracking-[0.4em] uppercase mb-3 font-semibold">
            Featured Masterpieces
          </p>
          <h2 className="text-white text-3xl md:text-4xl font-bold font-serif tracking-tight">
            Popular Designs
          </h2>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="flex justify-center items-center border border-white/5 bg-white/[0.01] rounded-xl h-64">
            <p className="text-white/40 tracking-widest uppercase text-xs">
              Curating high-end pieces shortly...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <Link
            to="/collections"
            className="inline-block border border-gold/40 text-gold font-medium px-10 py-4 tracking-widest uppercase text-xs hover:bg-gold hover:text-darkbg transition-all duration-300 shadow-lg hover:shadow-gold/10"
          >
            View All Collections
          </Link>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-28 relative z-20 border-y border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="absolute inset-0 bg-gold/[0.01] mix-blend-color-dodge pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-gold text-xs tracking-[0.4em] uppercase mb-3 font-semibold">
              The People Behind Delta
            </p>
            <h2 className="text-white text-3xl md:text-4xl font-bold font-serif tracking-tight">
              Our Founders
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {[
              {
                name: "Gurdeep Singh",
                role: "Founder",
                image:
                  "https://res.cloudinary.com/gufssbcd/image/upload/v1788566962/deltatrophies/founders/founder_male_1.jpg",
                slogan:
                  "Excellence is not a destination — it is the standard we set every single day.",
              },
              {
                name: "Satwinder Kaur Bedi",
                role: "Co-Founder",
                image:
                  "https://res.cloudinary.com/gufssbcd/image/upload/v1788566959/deltatrophies/founders/founder_female_1.jpg",
                slogan:
                  "Behind every trophy is a story of perseverance — we are here to tell that story.",
              },
            ].map((founder, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.7 }}
                className="text-center group"
              >
                {/* Photo */}
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gold to-amber-300 p-[1px] shadow-xl shadow-gold/10">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img
                        src={founder.image}
                        alt={founder.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <p className="text-gold text-xs tracking-widest uppercase mb-1 font-semibold">
                  {founder.role}
                </p>
                <h3 className="text-white text-xl font-bold font-serif mb-4">
                  {founder.name}
                </h3>
                <blockquote className="text-white/50 text-sm italic leading-relaxed max-w-sm mx-auto border-t border-gold/20 pt-4">
                  "{founder.slogan}"
                </blockquote>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative z-20 bg-darkbg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6 text-center divide-x-0 md:divide-x divide-white/[0.08]">
            {[
              { number: 27, suffix: "+", label: "Years of Craft" },
              { number: 500, suffix: "+", label: "Bespoke Designs" },
              { number: 10000, suffix: "+", label: "Honoured Laureates" },
              { number: 20, suffix: "+", label: "Cities Served" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="px-4"
              >
                <div className="text-gold text-4xl md:text-5xl font-light tracking-tight font-serif mb-3">
                  {stat.number.toLocaleString()}
                  {stat.suffix}
                </div>
                <p className="text-white/40 text-[11px] tracking-[0.2em] uppercase font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
