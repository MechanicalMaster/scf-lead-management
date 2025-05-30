"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MasterService } from "@/lib/db"
import type { ErrorCodeMaster } from "@/lib/db"
import { ChevronLeft, ChevronRight } from "lucide-react"
import MasterLayout from "./master-layout"

export default function ErrorCodeMasterComponent() {
  const [errorCodes, setErrorCodes] = useState<ErrorCodeMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    // Load error codes from IndexedDB
    const loadErrorCodes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get total records count
        const countResult = await MasterService.getTotalRecords('error_codes');
        if (countResult.success && countResult.count !== undefined) {
          setTotalRecords(countResult.count);
        } else {
          setError("Failed to load record count");
          return;
        }
        
        // Get paginated records
        const result = await MasterService.getRecords(
          'error_codes', 
          {}, 
          undefined, 
          itemsPerPage, 
          (currentPage - 1) * itemsPerPage
        );
        
        if (result.success && result.data) {
          // Type assertion to ensure correct type
          setErrorCodes(result.data as ErrorCodeMaster[]);
        } else {
          setError("Failed to load error codes data");
        }
      } catch (err) {
        console.error("Error loading error codes:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadErrorCodes();
  }, [currentPage, itemsPerPage]);
  
  // Pagination handlers
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <MasterLayout 
      title="Error Code Master" 
      description="Manage error codes for the application"
      storeName="error_codes"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 dark:border-gray-700 rounded-full border-t-blue-600 dark:border-t-blue-500"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading error codes...</p>
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
                  <TableHead>Error Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No error codes available. Use the Upload tab to add data.
                    </TableCell>
                  </TableRow>
                ) : (
                  errorCodes.map((errorCode, idx) => (
                    <TableRow key={errorCode.id || idx}>
                      <TableCell className="font-medium">{errorCode.errorCode}</TableCell>
                      <TableCell>{errorCode.description}</TableCell>
                      <TableCell>{errorCode.module}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            errorCode.severity === 'Error'
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : errorCode.severity === 'Warning'
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {errorCode.severity}
                        </span>
                      </TableCell>
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