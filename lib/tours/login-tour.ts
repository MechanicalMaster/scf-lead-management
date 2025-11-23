import Shepherd from 'shepherd.js';
import { createTour } from './shepherd-config';

export const createLoginTour = (): Shepherd.Tour => {
  const tour = createTour('login');

  tour.addStep({
    id: 'welcome',
    title: 'Welcome to SCF Lead Management',
    text: `Welcome! This is a demo environment with pre-configured test accounts. Let me show you the available login credentials and how to get started.`,
    buttons: [
      {
        text: 'Skip',
        action: tour.cancel,
        secondary: true
      },
      {
        text: 'Show Me',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'credentials-info',
    title: 'Available Test Accounts',
    text: `The system has different user roles, each with specific permissions and access levels. Let's explore the available test accounts.`,
    attachTo: {
      element: '[data-tour="credentials"]',
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
    id: 'admin-account',
    title: 'Admin Account',
    text: `<strong>Admin User</strong><br/>
    Email: admin@yesbank.in<br/>
    Password: password<br/><br/>
    Admin users have full access to all features including Masters management, Dashboard, Reports, and all Lead sections.`,
    attachTo: {
      element: '[data-tour="credentials"]',
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
    id: 'rm-account',
    title: 'RM (Relationship Manager) Account',
    text: `<strong>RM User</strong><br/>
    Email: rm@yesbank.in<br/>
    Password: password<br/><br/>
    RM users can manage their assigned leads, view reports, and access RM-specific features. They cannot access Masters.`,
    attachTo: {
      element: '[data-tour="credentials"]',
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
    id: 'rm-inbox-accounts',
    title: 'RM Inbox Users',
    text: `<strong>RM Inbox Users</strong><br/>
    Email: rm1@yesbank.in, rm2@yesbank.in, rm3@yesbank.in<br/>
    Password: password (for all)<br/><br/>
    RM Inbox users have access to their inbox and assigned leads. These accounts are useful for testing multi-user workflows.`,
    attachTo: {
      element: '[data-tour="credentials"]',
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
    id: 'psm-accounts',
    title: 'PSM (Product Sales Manager) Accounts',
    text: `<strong>PSM Users</strong><br/>
    Email: psm1@yesbank.in, psm2@yesbank.in<br/>
    Password: password (for all)<br/><br/>
    PSM users manage product sales leads and have access to PSM-specific features and dashboards.`,
    attachTo: {
      element: '[data-tour="credentials"]',
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
    id: 'email-field',
    title: 'Enter Email',
    text: 'Enter one of the email addresses shown above. For example, try "admin@yesbank.in" to explore all features.',
    attachTo: {
      element: '[data-tour="email-input"]',
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
    id: 'password-field',
    title: 'Enter Password',
    text: 'All test accounts use the same password: "password" (without quotes). You can toggle password visibility using the eye icon.',
    attachTo: {
      element: '[data-tour="password-input"]',
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
    id: 'sign-in',
    title: 'Sign In',
    text: 'Click the "Sign In" button to log in. You\'ll be redirected to the appropriate dashboard based on your user role.',
    attachTo: {
      element: '[data-tour="submit-button"]',
      on: 'top'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        secondary: true
      },
      {
        text: 'Got It!',
        action: tour.complete
      }
    ]
  });

  return tour;
};
