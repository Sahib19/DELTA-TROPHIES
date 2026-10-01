import { useState } from "react";

// Placeholder names and copy. Replace these with verified customer reviews.
const SAMPLE_REVIEWS = [
  {
    name: "Rohan Malhotra",
    quote:
      "The trophy looked beautiful on stage. The finish gave our award ceremony exactly the feel we wanted.",
  },
  {
    name: "Simran Kaur",
    quote:
      "Design bilkul waise hi bana jaise humne socha tha. Gold finish event mein kaafi premium lag raha tha.",
  },
  {
    name: "Aditya Mehra",
    quote:
      "The custom details were a lovely touch. The award felt special without looking overdone.",
  },
  {
    name: "Neha Arora",
    quote:
      "Medals aur trophies dono ki finishing achhi lagi. Stage par sab kuch bahut presentable tha.",
  },
  {
    name: "Karan Sethi",
    quote:
      "The engraving was crisp and easy to read. It made the whole presentation feel more personal.",
  },
  {
    name: "Priya Bansal",
    quote:
      "Photos mein achha lag raha tha, lekin haath mein lekar detailing aur bhi better lagi.",
  },
  {
    name: "Aman Khanna",
    quote:
      "We wanted something simple and elegant for our team awards. The final pieces looked just right.",
  },
  {
    name: "Jaspreet Gill",
    quote:
      "School function ke liye trophies li thi. Bachchon ko stage par milte waqt dekhna really special tha.",
  },
  {
    name: "Mehak Kapoor",
    quote:
      "The trophy had a good weight and a neat finish. It looked lovely in the event photos too.",
  },
  {
    name: "Harpreet Sandhu",
    quote:
      "Naam aur logo ki placement clean thi. Overall award bilkul waise hi laga jaisa imagine kiya tha.",
  },
  {
    name: "Ananya Verma",
    quote:
      "The presentation box made the award feel even more thoughtful. A nice detail for our ceremony.",
  },
  {
    name: "Vikram Chawla",
    quote:
      "Sports event ke liye cups chahiye the, aur stage par unka look kaafi impressive tha.",
  },
  {
    name: "Ishita Rao",
    quote:
      "I liked how clean the design was. It felt polished and suited our event perfectly.",
  },
  {
    name: "Manpreet Dhillon",
    quote:
      "Award ki detailing aur colour dono bahut achhe the. Recipient ko bhi kaafi pasand aaya.",
  },
  {
    name: "Nikhil Ahuja",
    quote:
      "The finished memento had a personal feel to it. Exactly what we wanted for the occasion.",
  },
  {
    name: "Tanya Bedi",
    quote:
      "Simple, classy aur neat finishing. Hamare event ke setup ke saath bahut achha match hua.",
  },
];

function ReviewCarousel() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section
      aria-labelledby="reviews-heading"
      className="relative z-20 bg-darkbg py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-gold">
              Words That Matter
            </p>
            <h2
              id="reviews-heading"
              className="font-serif text-3xl font-bold text-white md:text-4xl"
            >
              Customer Reviews
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/50">
              Sample reviews and names for this preview. Verified customer
              feedback will be added here.
            </p>
          </div>

          <div className="flex gap-3 motion-reduce:hidden">
            <button
              type="button"
              onClick={() => setIsPaused((paused) => !paused)}
              aria-label={isPaused ? "Play reviews" : "Pause reviews"}
              className="flex h-11 w-11 items-center justify-center border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-darkbg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {isPaused ? "▶" : "Ⅱ"}
            </button>
          </div>
        </div>

        <div
          aria-label="Review carousel"
          className="review-marquee overflow-hidden"
        >
          <div className={`review-marquee__track${isPaused ? " review-marquee__track--paused" : ""}`}>
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1 ? "true" : undefined}
                className="review-marquee__group"
              >
                {SAMPLE_REVIEWS.map((review) => (
                  <article
                    key={review.name}
                    className="review-marquee__card flex min-h-72 flex-col border border-gold/20 bg-white/[0.03] p-7"
                  >
                    <span aria-hidden="true" className="mb-5 font-serif text-4xl leading-none text-gold">
                      “
                    </span>
                    <p className="flex-1 font-serif text-lg leading-relaxed text-white/90">
                      {review.quote}”
                    </p>
                    <div className="mt-8 border-t border-gold/20 pt-4 text-sm font-medium text-gold">
                      {review.name}
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReviewCarousel;
