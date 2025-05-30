"use client"

import React, { createContext, useContext, ReactNode } from 'react'

interface AppContextType {
  isAppReady: boolean
}

const defaultContext: AppContextType = {
  isAppReady: false
}

const AppContext = createContext<AppContextType>(defaultContext)

export const useApp = () => useContext(AppContext)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAppReady, setIsAppReady] = React.useState(false)

  // Mark the app as ready after first render
  React.useEffect(() => {
    setIsAppReady(true)
  }, [])

  return (
    <AppContext.Provider 
      value={{ 
        isAppReady
      }}
    >
      {children}
    </AppContext.Provider>
  )
} 