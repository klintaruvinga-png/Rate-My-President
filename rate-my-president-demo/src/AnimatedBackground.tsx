import React, { useEffect, useRef, useState } from 'react';

interface AnimatedBackgroundProps {
  /** Enable particle effects (default: false for performance) */
  enableParticles?: boolean;
  /** Custom className for styling */
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  enableParticles = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Size canvas and initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas first
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles after canvas is sized
    if (enableParticles && !reducedMotion) {
      const particleCount = 30; // Conservative count for performance
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }

      particlesRef.current = newParticles;
    } else {
      particlesRef.current = [];
    }

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [enableParticles, reducedMotion]);

  // Animation loop
  useEffect(() => {
    if (!enableParticles || reducedMotion || particlesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enableParticles, reducedMotion]);

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      {/* Radial gradient background */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, oklch(0.18 0.03 250) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, oklch(0.16 0.05 250) 0%, transparent 50%),
            oklch(0.15 0.04 250)
          `,
        }}
      />

      {/* Particle canvas (optional) */}
      {enableParticles && !reducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 opacity-30"
          style={{ willChange: 'transform' }}
        />
      )}

      {/* Subtle globe texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
