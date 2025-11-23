# Shepherd.js Tour Integration

This directory contains the Shepherd.js tour configuration and tour definitions for the SCF Lead Management application.

## Overview

Shepherd.js is integrated to provide interactive guided tours for users. The integration includes:

- Custom theme matching the application's design system
- Support for both light and dark modes
- Tour completion tracking using localStorage
- Reusable tour configuration

## File Structure

```
lib/tours/
├── shepherd-config.ts      # Core configuration and utilities
├── dashboard-tour.ts       # Dashboard tour definition
├── new-leads-tour.ts       # New Leads page tour definition
├── login-tour.ts           # Login page tour definition
├── index.ts                # Export barrel file
└── README.md               # This file
```

## Creating a New Tour

### 1. Create a Tour File

Create a new file in `lib/tours/` (e.g., `my-page-tour.ts`):

```typescript
import Shepherd from 'shepherd.js';
import { createTour } from './shepherd-config';

export const createMyPageTour = (): Shepherd.Tour => {
  const tour = createTour('my-page'); // Unique tour ID

  tour.addStep({
    id: 'step-1',
    title: 'Step Title',
    text: 'Step description',
    attachTo: {
      element: '[data-tour="my-element"]',
      on: 'bottom' // Options: top, bottom, left, right
    },
    buttons: [
      {
        text: 'Skip',
        action: tour.cancel,
        secondary: true
      },
      {
        text: 'Next',
        action: tour.next
      }
    ]
  });

  // Add more steps...

  tour.addStep({
    id: 'finish',
    title: 'All Done!',
    text: 'You\'re all set!',
    buttons: [
      {
        text: 'Finish',
        action: tour.complete
      }
    ]
  });

  return tour;
};
```

### 2. Add Data Attributes to Elements

Mark elements you want to highlight in tours with `data-tour` attributes:

```tsx
<button data-tour="add-lead">Add Lead</button>
<div data-tour="leads-table">
  {/* Table content */}
</div>
```

### 3. Use the Tour in Your Component

```tsx
'use client';

import { createMyPageTour } from '@/lib/tours/my-page-tour';
import { resetTour } from '@/lib/tours/shepherd-config';

export function MyComponent() {
  const handleStartTour = () => {
    resetTour('my-page');
    const tour = createMyPageTour();
    tour.start();
  };

  return (
    <button onClick={handleStartTour}>
      Start Tour
    </button>
  );
}
```

### 4. Export the Tour

Add your tour to `lib/tours/index.ts`:

```typescript
export { createMyPageTour } from './my-page-tour';
```

## Tour Configuration Options

### Step Options

```typescript
{
  id: 'unique-step-id',           // Required: Unique identifier
  title: 'Step Title',            // Optional: Step title
  text: 'Step description',       // Required: Step content
  attachTo: {                     // Optional: Attach to element
    element: '[selector]',        // CSS selector
    on: 'bottom'                  // Position: top, bottom, left, right
  },
  buttons: [                      // Optional: Navigation buttons
    {
      text: 'Button Text',
      action: tour.next,          // or tour.back, tour.cancel, tour.complete
      secondary: true             // Optional: Secondary button style
    }
  ],
  scrollTo: {                     // Optional: Scroll behavior
    behavior: 'smooth',
    block: 'center'
  },
  classes: 'custom-class'        // Optional: Additional CSS classes
}
```

## Utility Functions

### `createTour(tourId: string)`

Creates a new tour instance with default configuration.

```typescript
const tour = createTour('my-tour');
```

### `isTourCompleted(tourId: string)`

Checks if a tour has been completed by the user.

```typescript
if (!isTourCompleted('dashboard')) {
  // Show tour
}
```

### `resetTour(tourId: string)`

Resets tour completion status.

```typescript
resetTour('dashboard'); // User can see the tour again
```

## Auto-Start Tours

To automatically start a tour when a page loads (only if not completed):

```tsx
'use client';

import { useEffect } from 'react';
import { createMyPageTour } from '@/lib/tours/my-page-tour';
import { isTourCompleted } from '@/lib/tours/shepherd-config';

export function MyPage() {
  useEffect(() => {
    if (!isTourCompleted('my-page')) {
      const tour = createMyPageTour();
      tour.start();
    }
  }, []);

  return <div>{/* Page content */}</div>;
}
```

## Styling

The tour theme is customized in `app/shepherd-styles.css` to match the application's design system:

- Uses CSS variables from Tailwind/shadcn
- Supports light and dark modes
- Custom button styles
- Responsive design

To modify the theme, edit `app/shepherd-styles.css`.

## Best Practices

1. **Keep tours short**: 3-5 steps is ideal
2. **Use clear language**: Simple, action-oriented text
3. **Test in both themes**: Ensure tours work in light and dark mode
4. **Mobile-friendly**: Test on different screen sizes
5. **Provide skip option**: Always allow users to skip tours
6. **Data attributes**: Use consistent naming for tour targets
7. **Tour IDs**: Use descriptive, unique IDs for each tour

## Examples

See existing tours:
- `login-tour.ts` - Auto-starting login credentials guide (auto-starts on first visit)
- `dashboard-tour.ts` - Simple welcome tour
- `new-leads-tour.ts` - Multi-step feature tour

## Troubleshooting

### Tour elements not found

Ensure the target element:
- Has the correct `data-tour` attribute
- Is rendered when the tour starts
- Is visible (not `display: none` or `visibility: hidden`)

### Styling issues

- Check that `app/shepherd-styles.css` is imported in `globals.css`
- Verify CSS variables are defined in your theme
- Inspect element to check applied classes

### Tour not appearing

- Check browser console for errors
- Ensure Shepherd.js is installed: `pnpm add shepherd.js`
- Verify the tour is started in a client component (`'use client'`)

## Resources

- [Shepherd.js Documentation](https://shepherdjs.dev/)
- [Shepherd.js GitHub](https://github.com/shipshapecode/shepherd)
