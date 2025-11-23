import Shepherd from 'shepherd.js';
import { createTour } from './shepherd-config';

export const createNewLeadsTour = (): Shepherd.Tour => {
  const tour = createTour('new-leads');

  tour.addStep({
    id: 'welcome',
    title: 'Welcome to New Leads',
    text: 'This page allows you to manage and create new leads in the system. Let me show you around.',
    buttons: [
      {
        text: 'Skip',
        action: tour.cancel,
        secondary: true
      },
      {
        text: 'Start',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'add-lead',
    title: 'Add New Lead',
    text: 'Click this button to create a new lead. You\'ll be able to enter all the necessary information.',
    attachTo: {
      element: '[data-tour="add-lead"]',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        secondary: true
      },
      {
        text: 'Next',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'leads-table',
    title: 'Leads Table',
    text: 'View all your leads in this table. You can sort, filter, and perform actions on individual leads.',
    attachTo: {
      element: '[data-tour="leads-table"]',
      on: 'top'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        secondary: true
      },
      {
        text: 'Next',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'finish',
    title: 'You\'re Ready!',
    text: 'You can now start managing your leads. Explore the different features and don\'t hesitate to use the help menu if you need assistance.',
    buttons: [
      {
        text: 'Finish',
        action: tour.complete
      }
    ]
  });

  return tour;
};
