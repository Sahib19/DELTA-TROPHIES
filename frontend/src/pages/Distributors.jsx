import { motion } from "framer-motion";
import getImageUrl from "../utils/getImageUrl";
import { CONTACT } from "../config/contact";
import SeoHead from "../components/SeoHead";

const distributors = [
  {
    id: 1,
    shopName: "J-Beez International",
    contactPerson: "Jaskaranjit Singh",
    phones: ["98728-40010", "94653-37714"],
    email: "jbitrophies@gmail.com",
    address: "#129-A, Basti Nau PNB Street",
    city: "Jalandhar",
    state: "Punjab",
    image:
      "https://res.cloudinary.com/gufssbcd/image/upload/deltatrophies/distributors/jbeez-shop.jpg",
  },
  {
    id: 2,
    shopName: "Trophy Planet",
    contactPerson: "Gursimran Singh",
    phones: ["99888-80158", "98038-48148"],
    email: "trophyplanetasr@gmail.com",
    address: "Kot Mahna Singh I/S Namdhari Kanda, T.T Road",
    city: "Amritsar",
    state: "Punjab",
    image:
      "https://res.cloudinary.com/gufssbcd/image/upload/deltatrophies/distributors/trophy-planet.jpg",
  },
  {
    id: 3,
    shopName: "Supreme Trophies",
    contactPerson: "S. Devinder Pal Singh",
    phones: ["92177-87756", "92179-80155"],
    email: "supremetrophy001@gmail.com",
    address: "47-D, Industrial Colony, Nr. Pahwa Hospital Road",
    city: "Ludhiana",
    state: "Punjab",
    image:
      "https://res.cloudinary.com/gufssbcd/image/upload/deltatrophies/distributors/supreme-trophies.jpg",
  },
  {
    id: 5,
    shopName: "Delta Trophies",
    contactPerson: "Sunny",
    phones: ["97115 55486"],
    email: null,
    address: "JG-2, Ground Floor, Flat No. 568, Vikas Puri",
    city: "New Delhi",
    state: "Delhi",
    image:
      "https://res.cloudinary.com/gufssbcd/image/upload/deltatrophies/distributors/sunny-delhi.jpg",
  },
  {
    id: 8,
    shopName: "Shri Ganpati Arts",
    contactPerson: "Ganpati",
    phones: ["95300-58280"],
    email: null,
    address: "House No. 443, Gali No. 02, Indra Colony",
    city: "Sri Ganganagar",
    state: "Rajasthan",
    image:
      "https://res.cloudinary.com/gufssbcd/image/upload/deltatrophies/distributors/Ganpati-dealer.jpg",
  },
];

function Distributors() {
  return (
    <div className="bg-darkbg w-full min-h-screen text-white">
      <SeoHead
        title="Find Delta Industries Trophy Distributors"
        description="Find authorised Delta Industries trophy distributors in Jalandhar, Amritsar, Ludhiana, Delhi, Bathinda, Muzaffarnagar and Sri Ganganagar."
        canonicalPath="/distributors"
      />
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <p className="text-yellow-400 text-xs tracking-[0.4em] uppercase mb-2 font-semibold">
            Find Us Near You
          </p>
          <h1 className="text-white text-5xl font-bold mb-4">
            Our Distributors
          </h1>
          <p className="text-white/50 text-sm max-w-xl leading-relaxed">
            Delta Industries products are available through our trusted network
            of distributors across India. Find your nearest distributor below.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-8 border-y border-gold/20 py-6 mb-16"
        >
          {[
            { number: "5+", label: "Authorised Distributors" },
            { number: "5+", label: "Cities Covered" },
            { number: "3+", label: "States" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-gold text-2xl font-bold">{stat.number}</p>
              <p className="text-white/40 text-xs tracking-wider uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Distributors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {distributors.map((dist, index) => (
            <motion.div
              key={dist.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="group border border-white/[0.06] hover:border-gold/40 transition-all duration-300 overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent"
            >
              {/* Shop Image */}
              <div className="relative h-64 overflow-hidden bg-white/5">
                <img
                  src={getImageUrl(dist.image)}
                  alt={dist.shopName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-darkbg/80 backdrop-blur-sm border border-gold/30 px-3 py-1">
                  <p className="text-gold text-xs tracking-wider uppercase font-semibold">
                    {dist.city}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-white text-lg font-bold mb-1 group-hover:text-gold transition-colors duration-300">
                  {dist.shopName}
                </h3>

                {dist.contactPerson && (
                  <p className="text-white/40 text-xs tracking-wider mb-4">
                    {dist.contactPerson}
                  </p>
                )}

                <div className="flex flex-col gap-2 mb-4">
                  {dist.address && (
                    <div className="flex gap-2 items-start">
                      <span className="text-gold text-xs mt-0.5">📍</span>
                      <p className="text-white/50 text-xs leading-relaxed">
                        {dist.address}, {dist.city}, {dist.state}
                      </p>
                    </div>
                  )}

                  {dist.phones.map((phone, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-gold text-xs">📞</span>
                      <a
                        href={`tel:+91${phone.replace(/\D/g, "")}`}
                        className="text-white/50 hover:text-gold text-xs transition-colors"
                      >
                        {phone}
                      </a>
                    </div>
                  ))}

                  {dist.email && (
                    <div className="flex gap-2 items-center">
                      <span className="text-gold text-xs">✉️</span>
                      <a
                        href={`mailto:${dist.email}`}
                        className="text-white/50 hover:text-gold text-xs transition-colors truncate"
                      >
                        {dist.email}
                      </a>
                    </div>
                  )}
                </div>

                {dist.phones.length > 0 && (
                  <a
                    href={`tel:+91${dist.phones[0].replace(/\D/g, "")}`}
                    className="inline-flex items-center gap-2 border border-gold/30 text-yellow-400 text-xs tracking-widest uppercase px-4 py-2 hover:bg-gold hover:text-darkbg transition-all duration-300 w-full justify-center mt-2"
                  >
                    Call Now
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Become a Distributor CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-gold/20 p-10 text-center bg-gradient-to-b from-gold/5 to-transparent"
        >
          <p className="text-gold text-xs tracking-[0.4em] uppercase mb-3 font-semibold">
            Grow With Us
          </p>
          <h2 className="text-white text-3xl font-bold mb-4">
            Become an Authorised Distributor
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Interested in partnering with Delta Industries? Join our trusted
            network and bring premium trophies to your city.
          </p>
          <a
            href={`tel:${CONTACT.phone}`}
            className="inline-block bg-gold text-darkbg font-bold px-10 py-4 tracking-widest uppercase text-xs hover:bg-gold/90 transition-colors"
          >
            Contact Us Today
          </a>
        </motion.div>
      </div>
    </div>
  );
}

export default Distributors;
