'use client';

import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createDashboardTour } from '@/lib/tours/dashboard-tour';
import { resetTour } from '@/lib/tours/shepherd-config';

export function TourTrigger() {
  const handleStartDashboardTour = () => {
    // Reset tour completion status
    resetTour('dashboard');

    // Create and start the tour
    const tour = createDashboardTour();
    tour.start();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Help & Tours">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Help & Tours</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleStartDashboardTour}>
          Dashboard Tour
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
