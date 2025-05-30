"use client"

import { useEffect, useState } from "react"
import { useAuth } from "./auth-provider"
import RouteGuard from "./route-guard"
import { initializeDatabase } from "@/lib/db-init"

export default function ClientSideAuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [dbInitialized, setDbInitialized] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  // Initialize the database
  useEffect(() => {
    async function initDb() {
      try {
        await initializeDatabase()
        setDbInitialized(true)
        console.log('Database initialized successfully')
      } catch (err: any) {
        console.error('Error initializing database:', err)
        setDbError(err?.message || 'Failed to initialize database')
      }
    }

    initDb()
  }, [])

  // Check if DB initialization failed
  if (dbError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="rounded-lg bg-red-50 p-6 dark:bg-red-900/30">
          <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-300">
            Database Initialization Error
          </h2>
          <p className="text-red-600 dark:text-red-400">{dbError}</p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Please try refreshing the page or clearing your browser cache.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-800/30 dark:text-red-300 dark:hover:bg-red-800/50"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // Use the existing RouteGuard for auth protection
  return <RouteGuard>{children}</RouteGuard>
} 