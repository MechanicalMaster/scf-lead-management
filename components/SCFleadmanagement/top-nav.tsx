"use client"

import { useState } from "react"
import { Bell, Sun, Moon, LogOut, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"

export default function TopNav() {
  const { theme, setTheme } = useTheme()
  const { userEmail, userRole, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  
  // Generate initials from email
  const getInitials = (email: string | null) => {
    if (!email) return "U";
    const parts = email.split('@');
    if (parts.length === 0) return "U";
    const name = parts[0];
    return name.substring(0, 2).toUpperCase();
  };

  // Get user role display text
  const getRoleDisplay = () => {
    switch (userRole) {
      case "admin": return "Admin";
      case "rm": return "RM User";
      case "rm-inbox": return "RM Inbox User";
      case "psm": return "PSM User";
      default: return "User";
    }
  };

  return (
    <div className="h-full flex items-center justify-end px-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/images/avatar.png" alt="Profile" />
                <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 p-2">
            <div className="flex items-center px-2 py-4">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src="/images/avatar.png" alt="Profile" />
                <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{userEmail}</p>
                <p className="text-xs text-muted-foreground">{getRoleDisplay()}</p>
              </div>
            </div>
            <DropdownMenuItem className="cursor-pointer" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

