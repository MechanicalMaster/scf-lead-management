'use client';

import LoginForm from "@/components/SCFleadmanagement/login-form"
import { useEffect, useMemo } from "react"
import { createLoginTour, isTourCompleted, resetTour } from "@/lib/tours"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectBanner } from "@/components/project-banner"

export default function LoginPage() {
  useEffect(() => {
    // Auto-start the tour if user hasn't seen it before
    if (!isTourCompleted('login')) {
      const tour = createLoginTour();
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        tour.start();
      }, 500);
    }
  }, []);

  const handleStartTour = () => {
    resetTour('login');
    const tour = createLoginTour();
    tour.start();
  };

  // Generate stable decorative dots to avoid hydration errors
  const decorativeDots = useMemo(() => [
    { left: 10, top: 15, opacity: 0.3 },
    { left: 25, top: 45, opacity: 0.4 },
    { left: 45, top: 25, opacity: 0.5 },
    { left: 60, top: 65, opacity: 0.3 },
    { left: 75, top: 35, opacity: 0.45 },
    { left: 85, top: 80, opacity: 0.35 },
    { left: 15, top: 75, opacity: 0.4 },
    { left: 35, top: 55, opacity: 0.38 },
    { left: 55, top: 85, opacity: 0.42 },
    { left: 70, top: 20, opacity: 0.35 },
    { left: 90, top: 50, opacity: 0.45 },
    { left: 20, top: 90, opacity: 0.32 },
    { left: 50, top: 10, opacity: 0.48 },
    { left: 80, top: 60, opacity: 0.36 },
    { left: 40, top: 40, opacity: 0.44 },
    { left: 65, top: 75, opacity: 0.38 },
    { left: 30, top: 30, opacity: 0.41 },
    { left: 95, top: 40, opacity: 0.33 },
    { left: 12, top: 55, opacity: 0.47 },
    { left: 78, top: 12, opacity: 0.39 }
  ], []);

  return (
    <>
      {/* Project Portfolio Banner */}
      <ProjectBanner />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 p-4 pt-20 sm:pt-24">
        {/* Help button to restart tour */}
        <button
          onClick={handleStartTour}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-[#1F1F23] shadow-lg hover:shadow-xl transition-all hover:scale-110"
          title="Show login help"
        >
          <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </button>

        <div className="relative w-full max-w-md">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-white dark:bg-[#1F1F23] rounded-2xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-600"></div>
              <div className="absolute inset-0">
                {decorativeDots.map((dot, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-blue-500"
                    style={{
                      left: `${dot.left}%`,
                      top: `${dot.top}%`,
                      opacity: dot.opacity
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative bg-white dark:bg-[#1F1F23] rounded-2xl shadow-xl overflow-hidden p-8">
            <div className="mb-8 flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                <span className="font-bold text-2xl text-white">SCF</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Lead Management
              </h1>
            </div>

            <LoginForm />

            <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
              © 2025 Yes Bank SCF Division. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
