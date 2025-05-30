"use client"

import { ReactNode, useEffect } from "react"
import RouteGuard from "./route-guard"
import dbUtils from "@/lib/dbUtils"

export default function ClientSideAuthWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize the database when the app starts
    const initDB = async () => {
      try {
        await dbUtils.initializeDBIfEmpty();
        console.log("Database initialization complete");
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };
    
    initDB();
  }, []);

  return (
    <RouteGuard>{children}</RouteGuard>
  )
} 