"use client";

// ==========================================
// IntersectionObserver フック
// ==========================================

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver({ 
  threshold = 0.1, 
  rootMargin = '0px' 
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return { ref, isIntersecting };
}

// ==========================================
// SessionStorage フック
// ==========================================

interface UseSessionStorageProps<T> {
  key: string;
  initialValue: T;
}

export function useSessionStorage<T>({ key, initialValue }: UseSessionStorageProps<T>) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// ==========================================
// TypingAnimation フック
// ==========================================

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
