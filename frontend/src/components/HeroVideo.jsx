import { useEffect, useRef, useState } from "react";

// These clips preserve the original SDR colors at 0.7x with interpolated 60 FPS frames.
const HERO_VIDEOS = [
  {
    id: "hero-video-1",
    desktop:
      "https://res.cloudinary.com/gufssbcd/video/upload/c_limit,w_1920,q_auto:good,vc_h264,fl_progressive,f_mp4/v1790855307/deltatrophies/hero/hero-video-1-smooth-70-color.mp4",
    mobile:
      "https://res.cloudinary.com/gufssbcd/video/upload/c_limit,w_1280,q_auto:good,vc_h264,fl_progressive,f_mp4/v1790855307/deltatrophies/hero/hero-video-1-smooth-70-color.mp4",
    poster:
      "https://res.cloudinary.com/gufssbcd/video/upload/so_0,c_limit,w_1920,q_auto:best,f_jpg/v1790317174/deltatrophies/hero/hero-video-1.jpg",
  },
  {
    id: "hero-video-2",
    desktop:
      "https://res.cloudinary.com/gufssbcd/video/upload/c_limit,w_1920,q_auto:good,vc_h264,fl_progressive,f_mp4/v1790855317/deltatrophies/hero/hero-video-2-smooth-70-color.mp4",
    mobile:
      "https://res.cloudinary.com/gufssbcd/video/upload/c_limit,w_1280,q_auto:good,vc_h264,fl_progressive,f_mp4/v1790855317/deltatrophies/hero/hero-video-2-smooth-70-color.mp4",
    poster:
      "https://res.cloudinary.com/gufssbcd/video/upload/so_0,c_limit,w_1920,q_auto:best,f_jpg/v1790317208/deltatrophies/hero/hero-video-2.jpg",
  },
];

function preloaderHasFinished() {
  try {
    return sessionStorage.getItem("delta-preloader-shown") === "true";
  } catch {
    return false;
  }
}

function HeroVideo() {
  const videoRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playbackStarted, setPlaybackStarted] = useState(preloaderHasFinished);

  useEffect(() => {
    const startPlayback = () => setPlaybackStarted(true);
    window.addEventListener("delta:preloader-exit", startPlayback);
    return () => window.removeEventListener("delta:preloader-exit", startPlayback);
  }, []);

  useEffect(() => {
    if (!playbackStarted) return;
    void videoRefs.current[activeIndex]?.play().catch(() => {
      // Muted playback normally starts automatically; the poster is fallback.
    });
  }, [activeIndex, playbackStarted]);

  const playNextVideo = async (finishedIndex) => {
    if (finishedIndex !== activeIndex) return;

    const nextIndex = (finishedIndex + 1) % HERO_VIDEOS.length;
    const nextVideo = videoRefs.current[nextIndex];
    if (!nextVideo) return;

    nextVideo.currentTime = 0;
    try {
      // Keep the current frame visible until the next video is actually playing.
      await nextVideo.play();
      setActiveIndex((current) =>
        current === finishedIndex ? nextIndex : current,
      );
    } catch {
      // The current frame remains visible if playback is temporarily blocked.
    }
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-darkbg">
      {HERO_VIDEOS.map((video, index) => (
        <video
          key={video.id}
          ref={(element) => {
            videoRefs.current[index] = element;
          }}
          autoPlay={index === 0 && playbackStarted}
          muted
          playsInline
          preload="auto"
          poster={video.poster}
          onEnded={() => playNextVideo(index)}
          onError={() => playNextVideo(index)}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            activeIndex === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <source
            src={video.mobile}
            media="(max-width: 767px)"
            type="video/mp4"
          />
          <source src={video.desktop} type="video/mp4" />
        </video>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-black/10" />
    </div>
  );
}

export default HeroVideo;
