"use client"

import { useState } from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth, UserRole } from "@/components/auth-provider"

// Dummy users for testing
const USERS = [
  { email: "admin@yesbank.in", password: "password", role: "admin" as UserRole, id: "admin001" },
  { email: "rm@yesbank.in", password: "password", role: "rm" as UserRole, id: "RM001" },
  { email: "rm1@yesbank.in", password: "password", role: "rm-inbox" as UserRole, id: "REM0000001" },
  { email: "rm2@yesbank.in", password: "password", role: "rm-inbox" as UserRole, id: "REM0000002" },
  { email: "rm3@yesbank.in", password: "password", role: "rm-inbox" as UserRole, id: "REM0000003" },
]

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    // Find matching user from dummy users
    const user = USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    
    setTimeout(() => {
      if (user) {
        // Login with email, role and ID
        login(user.email, user.role, user.id)
        
        // Redirect based on role
        if (user.role === "rm") {
          router.push("/rm-leads")
        } else if (user.role === "rm-inbox") {
          router.push("/rm-inbox")
        } else {
          router.push("/dashboard")
        }
      } else {
        setError("Invalid email or password")
        setIsLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="w-full space-y-5">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Sign in to SCF Lead Management</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Test credentials:
          <br />
          Admin: admin@yesbank.in / password
          <br />
          RM: rm@yesbank.in / password
          <br />
          RM Inbox Users: rm1@yesbank.in, rm2@yesbank.in, rm3@yesbank.in / password
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30 rounded-md flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@yesbank.in"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <Button type="submit" className="w-full h-11 mt-6" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  )
} 