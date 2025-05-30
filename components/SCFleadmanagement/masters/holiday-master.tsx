"use client"

import { useState, useEffect } from "react"
import MasterLayout from "./master-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MasterService } from "@/lib/db"
import type { HolidayMaster } from "@/lib/db"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Helper function to format date values
const formatDate = (dateValue: string | number | null | undefined): string => {
  if (!dateValue) return '';
  
  // If it's already a valid ISO date string (YYYY-MM-DD)
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // If it's a numeric Excel date (days since 1900-01-01)
  if (typeof dateValue === 'number' || !isNaN(Number(dateValue))) {
    // Convert Excel date to JavaScript Date
    // Excel date system (days since 1900-01-01, with leap year bug)
    try {
      const excelDate = typeof dateValue === 'number' ? dateValue : Number(dateValue);
      const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      return jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } catch (e) {
      console.error("Error formatting date:", e);
      return String(dateValue);
    }
  }
  
  // Return as is if we can't parse it
  return String(dateValue);
};

export default function HolidayMasterComponent() {
  const [holidays, setHolidays] = useState<HolidayMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    // Load holiday data from IndexedDB
    const loadHolidays = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get total records count
        const countResult = await MasterService.getTotalRecords('holiday_master');
        if (countResult.success && countResult.count !== undefined) {
          setTotalRecords(countResult.count);
        } else {
          setError("Failed to load record count");
          return;
        }
        
        // Get paginated records
        const result = await MasterService.getRecords(
          'holiday_master', 
          {}, 
          undefined, 
          itemsPerPage, 
          (currentPage - 1) * itemsPerPage
        );
        
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
  }, [currentPage, itemsPerPage]);
  
  // Pagination handlers
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

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
        <>
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
                      <TableCell>{formatDate(holiday.date || holiday.Date)}</TableCell>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>{holiday.type || holiday.HolidayType}</TableCell>
                      <TableCell>{holiday.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination UI */}
          {totalRecords > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records
              </p>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages || totalRecords === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </MasterLayout>
  )
}
