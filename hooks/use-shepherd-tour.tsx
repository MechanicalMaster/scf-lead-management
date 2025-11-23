'use client';

import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';

export const useShepherdTour = (
  createTourFn: () => Shepherd.Tour,
  autoStart = false
) => {
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      tourRef.current = createTourFn();

      if (autoStart) {
        tourRef.current.start();
      }

      return () => {
        if (tourRef.current) {
          tourRef.current.complete();
        }
      };
    }
  }, []);

  const startTour = () => {
    if (tourRef.current) {
      tourRef.current.start();
    }
  };

  const cancelTour = () => {
    if (tourRef.current) {
      tourRef.current.cancel();
    }
  };

  return {
    tour: tourRef.current,
    startTour,
    cancelTour
  };
};
