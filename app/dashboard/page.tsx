'use client';

import Dashboard from "@/components/SCFleadmanagement/dashboard"
import Layout from "@/components/SCFleadmanagement/layout"
import { useEffect } from "react"
import { createDashboardTour, isTourCompleted } from "@/lib/tours"

export default function DashboardPage() {
  useEffect(() => {
    // Auto-start the dashboard tour if user hasn't seen it before
    if (!isTourCompleted('dashboard')) {
      const tour = createDashboardTour();
      // Delay to ensure page is fully rendered
      setTimeout(() => {
        tour.start();
      }, 1000);
    }
  }, []);

  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

