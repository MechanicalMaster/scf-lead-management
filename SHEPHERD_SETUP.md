# Shepherd.js Integration - Setup Summary

## Overview

Shepherd.js has been successfully integrated into the SCF Lead Management application to provide interactive guided tours for users. The system includes an auto-starting login tour that guides new users through available test credentials.

## What Was Installed

### 1. Package
- **shepherd.js v14.5.1** - Interactive tour library

### 2. Core Files

#### Tour Configuration (`lib/tours/`)
- `shepherd-config.ts` - Core configuration, utilities, and localStorage tracking
- `login-tour.ts` - **Auto-starting** login credentials guide (9 steps)
- `dashboard-tour.ts` - Dashboard welcome tour (3 steps)
- `new-leads-tour.ts` - New leads page tour (4 steps)
- `index.ts` - Barrel export file
- `README.md` - Comprehensive documentation

#### Styling
- `app/shepherd-styles.css` - Custom theme with light/dark mode support
- Updated `app/globals.css` to import Shepherd styles

#### Components & Hooks
- `hooks/use-shepherd-tour.tsx` - React hook for tour management
- `components/tour-trigger.tsx` - Reusable tour trigger dropdown
- Updated `components/SCFleadmanagement/sidebar.tsx` - Added "Start Tour" button
- Updated `components/SCFleadmanagement/login-form.tsx` - Added data-tour attributes

#### Pages
- Updated `app/login/page.tsx` - Auto-starts tour on first visit + help button

## Key Features

### 1. Auto-Starting Login Tour
When users first visit the login page, they automatically see a guided tour that:
- Welcomes them to the application
- Explains all available test accounts:
  - **Admin**: admin@yesbank.in / password
  - **RM**: rm@yesbank.in / password
  - **RM Inbox**: rm1@yesbank.in, rm2@yesbank.in, rm3@yesbank.in / password
  - **PSM**: psm1@yesbank.in, psm2@yesbank.in / password
- Shows how to fill in the email field
- Explains the password field and visibility toggle
- Guides to the sign-in button

### 2. Tour Completion Tracking
- Tours are tracked in localStorage
- Users only see tours once (unless manually restarted)
- Use `resetTour('tour-id')` to allow users to see tours again

### 3. Manual Tour Triggers
- **Login page**: Floating help button (top-right corner)
- **Sidebar**: "Start Tour" button above logout

### 4. Custom Theme
- Matches your application's design system
- Uses CSS variables from Tailwind/shadcn
- Full dark mode support
- Smooth animations and transitions

## User Experience Flow

### First-Time User
1. User navigates to the application
2. Redirected to `/login` page
3. **Tour auto-starts after 500ms**
4. Tour guides through all available credentials
5. User can skip or complete tour
6. Tour won't show again (tracked in localStorage)

### Returning User
1. User navigates to `/login`
2. Tour doesn't auto-start (already completed)
3. Can manually restart tour via help button (top-right)

### Logged-In User
1. Can access tours via sidebar "Start Tour" button
2. Dashboard tour available
3. Can add more tours for different pages

## How to Use

### Starting Tours Manually

#### From Login Page
Click the floating help button (question mark icon) in the top-right corner.

#### From Dashboard/Any Page with Sidebar
1. Open the sidebar menu
2. Scroll to bottom
3. Click "Start Tour" button

### Creating New Tours

Follow the guide in `lib/tours/README.md`. Basic steps:

1. Create tour file in `lib/tours/my-tour.ts`
2. Add data-tour attributes to your page elements
3. Import and use in your component:

```tsx
import { createMyTour } from '@/lib/tours';

const tour = createMyTour();
tour.start();
```

### Auto-Starting Tours on Page Load

```tsx
'use client';

import { useEffect } from 'react';
import { createMyTour, isTourCompleted } from '@/lib/tours';

export function MyPage() {
  useEffect(() => {
    if (!isTourCompleted('my-tour')) {
      const tour = createMyTour();
      setTimeout(() => tour.start(), 500);
    }
  }, []);

  return <div>{/* content */}</div>;
}
```

## Available Test Credentials

The login tour showcases these credentials:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@yesbank.in | password | Full access (Masters, Dashboard, Reports, All Leads) |
| RM | rm@yesbank.in | password | RM Leads, Reports, Dashboard (No Masters) |
| RM Inbox | rm1@yesbank.in | password | RM Inbox, Assigned Leads |
| RM Inbox | rm2@yesbank.in | password | RM Inbox, Assigned Leads |
| RM Inbox | rm3@yesbank.in | password | RM Inbox, Assigned Leads |
| PSM | psm1@yesbank.in | password | PSM Leads, Dashboard |
| PSM | psm2@yesbank.in | password | PSM Leads, Dashboard |

## File Structure

```
/Users/ronak/Coding/Lead_Management/
├── app/
│   ├── login/page.tsx              # Auto-starts login tour
│   ├── shepherd-styles.css         # Custom tour theme
│   └── globals.css                 # Imports shepherd styles
├── components/
│   ├── tour-trigger.tsx            # Tour dropdown component
│   └── SCFleadmanagement/
│       ├── sidebar.tsx             # Updated with tour button
│       └── login-form.tsx          # Updated with data-tour attrs
├── hooks/
│   └── use-shepherd-tour.tsx       # React hook for tours
└── lib/
    └── tours/
        ├── shepherd-config.ts      # Core config
        ├── login-tour.ts           # Login tour ⭐
        ├── dashboard-tour.ts       # Dashboard tour
        ├── new-leads-tour.ts       # New leads tour
        ├── index.ts                # Exports
        └── README.md               # Full documentation
```

## Testing the Integration

### Test the Auto-Starting Login Tour

1. Clear localStorage (or use incognito mode)
2. Navigate to the login page
3. Tour should auto-start after 0.5 seconds
4. Complete or skip the tour
5. Refresh - tour should NOT auto-start (tracked as completed)
6. Click help button to manually restart

### Test Manual Tour Triggers

1. Log in with any credentials
2. Open sidebar menu
3. Click "Start Tour" at bottom
4. Dashboard tour should start

### Test in Dark Mode

1. Toggle dark mode in your application
2. Start any tour
3. Verify styling looks correct in dark theme

## Customization

### Update Tour Content
Edit the tour files in `lib/tours/` to change step content, order, or add/remove steps.

### Update Styling
Edit `app/shepherd-styles.css` to customize the tour appearance.

### Add New Tours
Follow the guide in `lib/tours/README.md` - includes examples and best practices.

## Technical Details

- **Library**: Shepherd.js v14.5.1
- **Framework**: Next.js 15 with React 19
- **Styling**: Custom CSS with Tailwind variables
- **Storage**: localStorage for tour completion tracking
- **Tour IDs**: 'login', 'dashboard', 'new-leads'

## Benefits

1. **Improved Onboarding**: New users immediately understand available credentials
2. **Reduced Support**: Users self-discover features through guided tours
3. **Better UX**: Interactive guidance vs static documentation
4. **Flexible**: Easy to add tours for any page or feature
5. **Persistent**: Tracks completion so users aren't annoyed by repeated tours
6. **Accessible**: Users can always manually restart tours via help buttons

## Next Steps

Consider creating tours for:
- New Leads page workflow
- RM Inbox page features
- Dashboard metrics explanation
- Masters section (for admin users)
- Reports generation process

See `lib/tours/README.md` for detailed instructions on creating new tours.

## Support & Documentation

- Tour Documentation: `lib/tours/README.md`
- Shepherd.js Docs: https://shepherdjs.dev/
- GitHub: https://github.com/shipshapecode/shepherd

---

**Setup completed successfully!** The login tour will auto-start for all new users visiting the login page.
