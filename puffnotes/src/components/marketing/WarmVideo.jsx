import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const WarmVideo = ({ 
  src, 
  poster, 
  className = '',
  autoplay = true,
  muted = true,
  loop = true,
  ...props 
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [_isInView, setIsInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          if (entry.isIntersecting && autoplay) {
            video.play().catch(console.warn);
            setIsPlaying(true);
          } else if (!entry.isIntersecting) {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [autoplay]);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl warm-border warm-shadow ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-100px' }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop={loop}
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
        {...props}
      />
      
      {/* Warm overlay when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-warm-cream/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center warm-shadow">
            <svg className="w-6 h-6 text-warm-brown ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
      
      {/* Warm border glow effect */}
      <div className="absolute inset-0 rounded-xl warm-glow opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default WarmVideo;
