'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function ConfettiEffect({ trigger, duration = 3000 }: { trigger: number, duration?: number }) {
  useEffect(() => {
    if (trigger > 0) {
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [trigger, duration]);

  return null;
}

export function triggerSparkle(x: number, y: number) {
  confetti({
    particleCount: 20,
    spread: 40,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors: ['#ffdf00', '#ffffff', '#ffd700'],
    ticks: 40,
    gravity: 0.5,
    scalar: 0.5,
  });
}
