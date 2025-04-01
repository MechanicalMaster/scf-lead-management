"use client"

import { ReactNode } from "react"
import { AuthProvider } from "./auth-provider"
import RouteGuard from "./route-guard"

export default function ClientSideAuthWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RouteGuard>{children}</RouteGuard>
    </AuthProvider>
  )
} 