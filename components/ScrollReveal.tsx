import React, { useRef, useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
  animation?: 'fade-in' | 'fade-in-up' | 'slide-in-right' | 'zoom-in';
  delay?: string; // e.g. delay-100
  className?: string;
}

const ScrollReveal: React.FC<Props> = ({ 
  children, 
  animation = 'fade-in-up', 
  delay = '', 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAnimationClass = () => {
    switch (animation) {
      case 'fade-in': return 'animate-fade-in';
      case 'fade-in-up': return 'animate-fade-in-up';
      case 'slide-in-right': return 'animate-slide-in-right';
      case 'zoom-in': return 'animate-zoom-in';
      default: return 'animate-fade-in-up';
    }
  };

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? getAnimationClass() : 'opacity-0'} ${delay}`}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;