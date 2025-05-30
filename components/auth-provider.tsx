"use client"

import { createContext, useState, useEffect, useContext, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

// Define available roles
export type UserRole = "admin" | "rm" | "rm-inbox" | null

interface AuthContextType {
  isAuthenticated: boolean
  userEmail: string | null
  userRole: UserRole
  login: (email: string, role: UserRole) => void
  logout: () => void
  hasAccess: (page: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in from localStorage
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    const email = localStorage.getItem("userEmail")
    const role = localStorage.getItem("userRole") as UserRole
    
    setIsAuthenticated(loggedIn)
    setUserEmail(email)
    setUserRole(role)
    setIsLoading(false)
    
    // Redirect logic
    if (!isLoading) {
      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login")
      } else if (isAuthenticated && pathname === "/login") {
        // Redirect based on role
        if (userRole === "rm") {
          router.push("/rm-leads")
        } else if (userRole === "rm-inbox") {
          router.push("/rm-inbox")
        } else {
          router.push("/dashboard")
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, userRole])

  // Define page access permissions based on user role
  const hasAccess = (page: string): boolean => {
    if (!isAuthenticated || !userRole) return false

    // Admin has access to everything
    if (userRole === "admin") {
      return true
    }

    // RM only has access to RM leads, lead details, and reports pages
    if (userRole === "rm") {
      return page === "/rm-leads" || 
             page.startsWith("/lead-details/") || 
             page === "/reports"
    }
    
    // RM-inbox users only have access to their inbox and lead details
    if (userRole === "rm-inbox") {
      return page === "/rm-inbox" || 
             page.startsWith("/lead-details/")
    }

    return false
  }

  const login = (email: string, role: UserRole) => {
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("userEmail", email)
    localStorage.setItem("userRole", role as string)
    setIsAuthenticated(true)
    setUserEmail(email)
    setUserRole(role)
  }

  const logout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userRole")
    setIsAuthenticated(false)
    setUserEmail(null)
    setUserRole(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userRole, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 