import Shepherd from 'shepherd.js';
import { createTour } from './shepherd-config';

export const createDashboardTour = (): Shepherd.Tour => {
  const tour = createTour('dashboard');

  tour.addStep({
    id: 'welcome',
    title: 'Welcome to Your Dashboard',
    text: 'This is your command center for managing leads. Let me show you the key features and how to navigate.',
    buttons: [
      {
        text: 'Skip',
        action: tour.cancel,
        secondary: true
      },
      {
        text: 'Start Tour',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'hamburger-menu',
    title: 'Hamburger Menu',
    text: 'Click this hamburger menu icon to open the sidebar navigation. From here, you can access all sections: Dashboard, New Leads, RM Inbox, PSM Leads, Reports, and Masters.',
    attachTo: {
      element: '[data-tour="hamburger-menu"]',
      on: 'right'
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
    id: 'sidebar-navigation',
    title: 'Sidebar Navigation',
    text: 'The sidebar shows all available sections based on your role. Navigate between Dashboard, New Leads, RM Inbox, Reports, and more. Admin users also have access to Masters section.',
    attachTo: {
      element: '[data-tour="sidebar"]',
      on: 'right'
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
    id: 'summary-widgets',
    title: 'Key Metrics at a Glance',
    text: 'These summary cards show your most important metrics: Total Leads, New Leads this week, Pending Actions, and Overdue items. The arrows indicate trend changes.',
    attachTo: {
      element: '[data-tour="summary-cards"]',
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
    id: 'status-distribution',
    title: 'Lead Status Distribution',
    text: 'This pie chart visualizes how your leads are distributed across different stages: New, Contacted, Qualified, Proposal, Negotiation, Closed Won, and Closed Lost.',
    attachTo: {
      element: '[data-tour="status-chart"]',
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
    id: 'lead-aging',
    title: 'Lead Aging Analysis',
    text: 'This bar chart shows how old your leads are in each status. Use this to identify leads that might need attention or follow-up.',
    attachTo: {
      element: '[data-tour="aging-chart"]',
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
    id: 'conversion-funnel',
    title: 'Conversion Funnel',
    text: 'Track your lead conversion rates through each stage. This helps you identify where leads drop off and optimize your process.',
    attachTo: {
      element: '[data-tour="conversion-funnel"]',
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
    title: 'You\'re All Set!',
    text: 'You now know how to navigate the dashboard and understand your key metrics. Explore the other sections using the hamburger menu, and you can restart this tour anytime from the sidebar.',
    buttons: [
      {
        text: 'Finish',
        action: tour.complete
      }
    ]
  });

  return tour;
};
