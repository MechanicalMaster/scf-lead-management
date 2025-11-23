'use client';

import { ExternalLink, Sparkles, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';

export function ProjectBanner() {
  const [isHovered, setIsHovered] = useState(false);

  // Generate stable particle positions using useMemo to avoid hydration errors
  const particles = useMemo(() => [
    { left: 15, top: 25, delay: 0, duration: 4.2 },
    { left: 75, top: 60, delay: 0.5, duration: 3.8 },
    { left: 40, top: 80, delay: 1, duration: 4.5 },
    { left: 85, top: 35, delay: 1.5, duration: 3.5 },
    { left: 25, top: 50, delay: 2, duration: 4.0 },
    { left: 60, top: 15, delay: 2.5, duration: 4.3 }
  ], []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="pointer-events-auto">
        <a
          href="https://ronaksethiya.com/projects/supply-chain-finance-lead-management/"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="block group"
        >
          {/* Banner Container */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_linear_infinite]" />
            </div>

            {/* Floating Particles Effect */}
            <div className="absolute inset-0 overflow-hidden">
              {particles.map((particle, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative px-4 py-3 sm:px-6 sm:py-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  {/* Left Section - Message */}
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-semibold text-white leading-tight">
                        <span className="hidden sm:inline">Explore the complete project breakdown, </span>
                        <span className="sm:hidden">View project details, </span>
                        technical architecture & design decisions
                      </p>
                    </div>
                  </div>

                  {/* Right Section - CTA Button */}
                  <div className="flex-shrink-0">
                    <div className={`
                      inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm
                      bg-white text-blue-700 shadow-lg
                      group-hover:shadow-xl group-hover:scale-105
                      transition-all duration-300
                      ${isHovered ? 'translate-x-1' : ''}
                    `}>
                      <span className="whitespace-nowrap">View Full Project</span>
                      <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Border Accent */}
            <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 dark:from-blue-500 dark:via-indigo-500 dark:to-blue-500" />
          </div>
        </a>
      </div>
    </div>
  );
}
