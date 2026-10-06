import { useEffect, useRef, useState } from "react";

// Browser-compatible H.264 encodes of the joined footage, at its original timing and 60 FPS.
const HERO_VIDEOS = {
  mobile:
    "https://res.cloudinary.com/gufssbcd/video/upload/v1791275520/deltatrophies/hero/hero-web-720p60-h264-sdr.mp4",
  standard:
    "https://res.cloudinary.com/gufssbcd/video/upload/v1791275452/deltatrophies/hero/hero-web-1080p60-h264-sdr.mp4",
  large:
    "https://res.cloudinary.com/gufssbcd/video/upload/v1791275321/deltatrophies/hero/hero-web-1440p60-h264-sdr.mp4",
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
  const [videoFailed, setVideoFailed] = useState(false);

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
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-darkbg bg-cover bg-center"
      style={{ backgroundImage: 'url("/hero-video-poster.jpg")' }}
    >
      <video
        ref={videoRef}
        autoPlay={playbackStarted}
        loop
        muted
        playsInline
        preload="auto"
        poster="/hero-video-poster.jpg"
        onError={() => setVideoFailed(true)}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover ${videoFailed ? "hidden" : ""}`}
      >
        <source
          src={HERO_VIDEOS.mobile}
          media="(max-width: 767px)"
          type="video/mp4"
        />
        <source
          src={HERO_VIDEOS.large}
          media="(min-width: 2200px)"
          type="video/mp4"
        />
        <source src={HERO_VIDEOS.standard} type="video/mp4" />
      </video>
    </div>
  );
}

export default HeroVideo;
