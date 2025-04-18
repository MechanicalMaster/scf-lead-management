import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import ClientSideAuthWrapper from "@/components/client-side-auth-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SCF Lead Management",
  description: "Lead Management System for Supply Chain Finance",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ClientSideAuthWrapper>
              {children}
            </ClientSideAuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'