"use client"

import type React from "react"

import { Menu, UserPlus, Users, FileBarChart, Database, ChevronDown, ChevronRight, LogOut, Settings, Sparkles } from "lucide-react"

import { Home } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const { userEmail, userRole, logout, hasAccess } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMastersExpanded, setIsMastersExpanded] = useState(false)
  const pathname = usePathname()

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: any
    children: React.ReactNode
  }) {
    // Skip rendering if user doesn't have access to this page
    if (!hasAccess(href)) return null

    const isActive = pathname === href || pathname.startsWith(`${href}/`)

    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? "bg-gray-100 text-gray-900 dark:bg-[#1F1F23] dark:text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
        }`}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <nav
        className={`
                fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-[#0F0F12] transform transition-transform duration-200 ease-in-out
                border-r border-gray-200 dark:border-[#1F1F23]
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold hover:cursor-pointer text-gray-900 dark:text-white">
                SCF Lead Management
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              {/* Show role indicator */}
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                <div className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                  {userRole === "admin" 
                    ? "Admin User" 
                    : userRole === "rm"
                      ? "RM User"
                      : userRole === "psm"
                        ? "PSM User"
                      : "RM Inbox User"}
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Overview
                </div>
                <div className="space-y-1">
                  <NavItem href="/dashboard" icon={Home}>
                    Dashboard
                  </NavItem>
                  <NavItem href="/reports" icon={FileBarChart}>
                    Reports
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Leads
                </div>
                <div className="space-y-1">
                  <NavItem href="/new-leads" icon={UserPlus}>
                    New Leads
                  </NavItem>
                  <NavItem href="/rm-leads" icon={Users}>
                    RM Leads
                  </NavItem>
                  <NavItem href="/rm-inbox" icon={Users}>
                    RM Inbox
                  </NavItem>
                  <NavItem href="/psm-leads" icon={Users}>
                    PSM Leads
                  </NavItem>
                  <NavItem href="/program-review" icon={Users}>
                    Program Review
                  </NavItem>
                </div>
              </div>

              {/* Configuration section */}
              {userRole === "admin" && (
                <div>
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Configuration
                  </div>
                  <div className="space-y-1">
                    <NavItem href="/configuration/escalation-rules" icon={Settings}>
                      Escalation Rules
                    </NavItem>
                    <NavItem href="/configuration/ai-rules" icon={Sparkles}>
                      AI Rules
                    </NavItem>
                  </div>
                </div>
              )}

              {/* Only show Masters section to admin users */}
              {userRole === "admin" && (
                <div>
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Masters
                  </div>
                  <button
                    className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
                    onClick={() => setIsMastersExpanded(!isMastersExpanded)}
                  >
                    <div className="flex items-center">
                      <Database className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span>Masters</span>
                    </div>
                    {isMastersExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isMastersExpanded && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-[#1F1F23] pl-3">
                      <Link
                        href="/masters/pincode-branch"
                        onClick={handleNavigation}
                        className="flex items-center py-2 text-sm transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Pincode Branch Master
                      </Link>
                      <Link
                        href="/masters/rm-branch"
                        onClick={handleNavigation}
                        className="flex items-center py-2 text-sm transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        RM Branch Master
                      </Link>
                      <Link
                        href="/masters/hierarchy"
                        onClick={handleNavigation}
                        className="flex items-center py-2 text-sm transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Hierarchy Master
                      </Link>
                      <Link
                        href="/masters/holiday-master"
                        onClick={handleNavigation}
                        className="flex items-center py-2 text-sm transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Holiday Master
                      </Link>
                      <Link
                        href="/masters/anchor-master"
                        onClick={handleNavigation}
                        className="flex items-center py-2 text-sm transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Anchor Master
                      </Link>
                      <Link
                        href="/masters/error-code-master"
                        onClick={handleNavigation}
                        className="flex items-center py-2 text-sm transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Error Code Master
                      </Link>
                      <Link
                        href="/masters/ai-prompts"
                        onClick={handleNavigation}
                        className="flex items-center py-2 text-sm transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        AI Prompts Master
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            {userEmail && (
              <div className="mb-4 px-3 py-2 bg-gray-50 dark:bg-[#1F1F23] rounded-md">
                <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{userEmail}</p>
              </div>
            )}
            <div className="space-y-1">
              <button 
                onClick={logout}
                className="flex w-full items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
              >
                <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
