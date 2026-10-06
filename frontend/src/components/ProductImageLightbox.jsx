import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import getImageUrl from "../utils/getImageUrl";

function ProductImageLightbox({ image, alt, name, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} image preview`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md sm:p-8"
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close image preview"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center border border-white/30 bg-darkbg/90 text-white transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:right-8 sm:top-8"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
          className="h-6 w-6"
        >
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>

      <div className="flex w-full max-w-[1100px] flex-col items-center gap-3">
        <div className="flex max-w-full items-center justify-center border border-gold/30 bg-white p-3 shadow-2xl shadow-black/50 sm:p-5">
          <img
            src={getImageUrl(image)}
            alt={alt}
            className="block h-auto max-h-[min(74dvh,820px)] w-auto max-w-[84vw] object-contain"
            decoding="async"
          />
        </div>
        <p className="max-w-full truncate text-center text-sm font-medium tracking-wide text-white">
          {name}
        </p>
      </div>
    </div>,
    document.body,
  );
}

export default ProductImageLightbox;
