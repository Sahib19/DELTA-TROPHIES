import { useEffect, useRef, useState } from "react";

// Joined originals, encoded for delivery at the source timing and 60 FPS with HDR colors.
const HERO_VIDEOS = {
  desktop:
    "https://res.cloudinary.com/gufssbcd/video/upload/v1791268190/deltatrophies/hero/hero-joined-1440p60-hdr.mp4",
  mobile:
    "https://res.cloudinary.com/gufssbcd/video/upload/v1791268269/deltatrophies/hero/hero-joined-1080p60-hdr.mp4",
};

function preloaderHasFinished() {
  try {
    return sessionStorage.getItem("delta-preloader-shown") === "true";
  } catch {
    return false;
  }
}

function HeroVideo() {
  const videoRef = useRef(null);
  const [playbackStarted, setPlaybackStarted] = useState(preloaderHasFinished);

  useEffect(() => {
    const startPlayback = () => setPlaybackStarted(true);
    window.addEventListener("delta:preloader-exit", startPlayback);
    return () => window.removeEventListener("delta:preloader-exit", startPlayback);
  }, []);

  useEffect(() => {
    if (!playbackStarted) return;
    void videoRef.current?.play().catch(() => {
      // Muted playback normally starts automatically.
    });
  }, [playbackStarted]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-darkbg">
      <video
        ref={videoRef}
        autoPlay={playbackStarted}
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src={HERO_VIDEOS.mobile}
          media="(max-width: 767px)"
          type="video/mp4"
        />
        <source src={HERO_VIDEOS.desktop} type="video/mp4" />
      </video>
    </div>
  );
}

export default HeroVideo;
