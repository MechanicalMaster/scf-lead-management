"use client"

import { useState, useEffect } from "react"
import MasterLayout from "./master-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MasterService } from "@/lib/db"
import type { HolidayMaster } from "@/lib/db"

export default function HolidayMasterComponent() {
  const [holidays, setHolidays] = useState<HolidayMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load holiday data from IndexedDB
    const loadHolidays = async () => {
      try {
        setLoading(true);
        const result = await MasterService.getRecords('holiday_master');
        
        if (result.success && result.data) {
          // Type assertion to ensure correct type
          setHolidays(result.data as HolidayMaster[]);
        } else {
          setError("Failed to load holiday data");
        }
      } catch (err) {
        console.error("Error loading holidays:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadHolidays();
  }, []);

  return (
    <MasterLayout 
      title="Holiday Master" 
      description="Manage holidays for your organization"
      storeName="holiday_master"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 dark:border-gray-700 rounded-full border-t-blue-600 dark:border-t-blue-500"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading holidays...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-4 my-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No holiday data available. Use the Upload tab to add data.
                  </TableCell>
                </TableRow>
              ) : (
                holidays.map((holiday, idx) => (
                  <TableRow key={holiday.id || idx}>
                    <TableCell>{holiday.date || holiday.Date}</TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>{holiday.type || holiday.HolidayType}</TableCell>
                    <TableCell>{holiday.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </MasterLayout>
  )
}
