"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasAccess, userRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip for login page
    if (pathname === "/login") return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Redirect to appropriate page if current page is not accessible
    if (!hasAccess(pathname)) {
      if (userRole === "rm") {
        router.push("/rm-leads")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, pathname, router, hasAccess, userRole])

  // Only render children if user has access to this route or it's the login page
  if (pathname === "/login" || (isAuthenticated && hasAccess(pathname))) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
} 