'use client';

import React, { useEffect, useRef } from 'react';

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Configuración de las estrellas
    const numStars = 80;
    const stars: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }> = [];

    // Poblamos el cielo
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.04 + 0.01,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Bucle de animación
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        // Ciclo de titilado
        star.twinklePhase += star.twinkleSpeed;
        const currentOpacity = star.opacity * (0.3 + 0.7 * Math.sin(star.twinklePhase));

        // Dibujar
        ctx.fillStyle = `rgba(226, 232, 240, ${currentOpacity})`; // Slate-200 color para brillo suave
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Movimiento lento vertical (deriva celeste)
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-20 pointer-events-none w-full h-full"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
