import Shepherd from 'shepherd.js';

export const defaultStepOptions: Shepherd.Step.StepOptions = {
  cancelIcon: {
    enabled: true
  },
  classes: 'shepherd-theme-custom',
  scrollTo: { behavior: 'smooth', block: 'center' }
};

export const createTour = (tourId: string): Shepherd.Tour => {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions
  });

  // Store tour completion in localStorage
  tour.on('complete', () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`shepherd-tour-${tourId}`, 'completed');
    }
  });

  return tour;
};

export const isTourCompleted = (tourId: string): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`shepherd-tour-${tourId}`) === 'completed';
  }
  return false;
};

export const resetTour = (tourId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`shepherd-tour-${tourId}`);
  }
};
