"use client"

import { useState, useEffect } from "react"
import { MasterService } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import MasterLayout from "@/components/SCFleadmanagement/masters/master-layout"
import type { SmartfinStatusUpdate } from "@/lib/db"
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { SMARTFIN_UPDATE_TEMPLATE_HEADERS } from "@/lib/constants"
import { safeDbOperation } from "@/lib/db-init"

export default function SmartfinStatusUpdateComponent() {
  const [records, setRecords] = useState<SmartfinStatusUpdate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [lastUploadTimestamp, setLastUploadTimestamp] = useState<string | null>(null)

  // Load records when component mounts or page changes
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const offset = (currentPage - 1) * itemsPerPage
        
        // Use safeDbOperation to handle potential database errors
        const result = await safeDbOperation(
          async () => MasterService.getRecords(
            'smartfin_status_updates',
            {}, // No filters initially
            undefined, // No specific sort field
            itemsPerPage,
            offset
          ),
          { success: false, data: [] }
        )

        if (result.success && result.data) {
          setRecords(result.data as SmartfinStatusUpdate[])
          
          // Get total count
          const countResult = await safeDbOperation(
            async () => MasterService.getTotalRecords('smartfin_status_updates'),
            { success: false }
          )
          
          if (countResult.success && countResult.count !== undefined) {
            setTotalRecords(countResult.count)
          }
        } else {
          setError("Failed to fetch records")
        }
      } catch (err) {
        console.error("Error fetching records:", err)
        setError("An error occurred while fetching records")
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
    
    // Check if there's a last upload timestamp in localStorage
    const timestamp = localStorage.getItem('lastUpload_smartfin_status_updates')
    if (timestamp) {
      setLastUploadTimestamp(timestamp)
    }
  }, [currentPage, itemsPerPage])

  // Handle search
  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setCurrentPage(1) // Reset to first page when searching
    
    try {
      let result;
      
      if (searchTerm.trim() === "") {
        // If search is cleared, get all records
        result = await safeDbOperation(
          async () => MasterService.getRecords(
            'smartfin_status_updates',
            {},
            undefined,
            itemsPerPage,
            0
          ),
          { success: false, data: [] }
        )
      } else {
        // Search in applicationNo, firmName, status, or rmName fields
        // Note: In a real implementation, you would need a better search method,
        // as this simple approach won't work for complex searches across multiple fields
        result = await safeDbOperation(
          async () => MasterService.getRecords(
            'smartfin_status_updates',
            { applicationNo: searchTerm }, // This is just a simple exact match
            undefined,
            itemsPerPage,
            0
          ),
          { success: false, data: [] }
        )
      }

      if (result.success && result.data) {
        setRecords(result.data as SmartfinStatusUpdate[])
      } else {
        setError("Search failed")
      }
    } catch (err) {
      console.error("Error searching records:", err)
      setError("An error occurred during search")
    } finally {
      setLoading(false)
    }
  }

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < Math.ceil(totalRecords / itemsPerPage)) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Format dates for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  return (
    <MasterLayout
      title="Smartfin Status Update"
      description="Upload and view Smartfin application status updates"
      storeName="smartfin_status_updates"
      lastUpdated={
        lastUploadTimestamp 
          ? {
              date: new Date(lastUploadTimestamp).toLocaleString(),
              user: "System"
            }
          : undefined
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex w-full sm:w-auto space-x-2">
            <div className="flex-1 sm:w-64">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search by application no, firm name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                />
              </div>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application No</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Firm Name</TableHead>
                <TableHead>Application Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested Amount</TableHead>
                <TableHead>Sanctioned Amount</TableHead>
                <TableHead>RM Name</TableHead>
                <TableHead>RM TAT</TableHead>
                <TableHead>Total TAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
                      <span className="ml-2">Loading records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.applicationNo}>
                    <TableCell className="font-medium">{record.applicationNo}</TableCell>
                    <TableCell>{formatDate(record.createdDate)}</TableCell>
                    <TableCell>{record.firmName}</TableCell>
                    <TableCell>{record.applicationType}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell>{record.requestedAmount}</TableCell>
                    <TableCell>{record.sanctionedAmount}</TableCell>
                    <TableCell>{record.rmName}</TableCell>
                    <TableCell>{record.rmTAT}</TableCell>
                    <TableCell>{record.totalTAT}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {records.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= Math.ceil(totalRecords / itemsPerPage) || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </MasterLayout>
  )
} 