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

function HeroVideo() {
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const startPlayback = () => {
      if (document.visibilityState === "hidden" || !video.paused) return;
      void video.play().catch(() => {
        // Retry when media is ready or the page becomes visible.
      });
    };

    startPlayback();
    video.addEventListener("canplay", startPlayback);
    document.addEventListener("visibilitychange", startPlayback);
    window.addEventListener("pageshow", startPlayback);

    return () => {
      video.removeEventListener("canplay", startPlayback);
      document.removeEventListener("visibilitychange", startPlayback);
      window.removeEventListener("pageshow", startPlayback);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-darkbg bg-cover bg-center"
      style={{ backgroundImage: 'url("/hero-video-poster.jpg")' }}
    >
      <video
        ref={videoRef}
        autoPlay
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
