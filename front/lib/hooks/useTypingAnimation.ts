"use client";

import { useState, useEffect } from 'react';

interface UseTypingAnimationProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function useTypingAnimation({ 
  text, 
  speed = 50, 
  delay = 0,
  onComplete 
}: UseTypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text || typeof text !== 'string') return;

    // リセット
    setDisplayText('');
    setIsComplete(false);

    const timer = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [text, speed, delay, onComplete]);

  return { displayText, isComplete };
}
