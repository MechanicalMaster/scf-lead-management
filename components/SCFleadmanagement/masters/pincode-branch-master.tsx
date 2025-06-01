"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import MasterLayout from "./master-layout"
import { MasterService } from "@/lib/db"
import type { PincodeBranch } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Helper function to safely convert any value to string for search
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase();
};

export default function PincodeBranchMaster() {
  const [searchTerm, setSearchTerm] = useState("")
  const [pincodeData, setPincodeData] = useState<PincodeBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    // Load pincode-branch data from IndexedDB
    const loadPincodeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get total records count
        const countResult = await MasterService.getTotalRecords('pincode_branch');
        if (countResult.success && countResult.count !== undefined) {
          setTotalRecords(countResult.count);
        } else {
          setError("Failed to load record count");
          return;
        }
        
        // Get paginated records
        const result = await MasterService.getRecords(
          'pincode_branch', 
          {}, 
          undefined, 
          itemsPerPage, 
          (currentPage - 1) * itemsPerPage
        );
        
        if (result.success && result.data) {
          // Type assertion to ensure correct type
          setPincodeData(result.data as PincodeBranch[]);
        } else {
          setError("Failed to load pincode-branch data");
        }
      } catch (err) {
        console.error("Error loading pincode-branch data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadPincodeData();
  }, [currentPage, itemsPerPage]);
  
  // Pagination handlers
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const searchTermLower = searchTerm.toLowerCase();
  const filteredData = pincodeData.filter(
    (item) =>
      safeString(item.Pincode || item.pincode).includes(searchTermLower) ||
      safeString(item.BranchCode || item.branchCode).includes(searchTermLower) ||
      safeString(item.BranchName || item.branchName).includes(searchTermLower) ||
      safeString(item.Cluster).includes(searchTermLower) ||
      safeString(item.Region || item.region).includes(searchTermLower)
  )

  return (
    <MasterLayout
      title="Pincode Branch Master"
      description="Manage the mapping between pincodes and branches"
      storeName="pincode_branch"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search by pincode, branch..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 dark:border-gray-700 rounded-full border-t-blue-600 dark:border-t-blue-500"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading pincode-branch data...</p>
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
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]">
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Pincode</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Branch Code</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Branch Name</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Cluster</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Region</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500 dark:text-gray-400">
                      {pincodeData.length === 0 
                        ? "No pincode-branch data available. Use the Upload tab to add data." 
                        : "No results found for your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, idx) => (
                    <TableRow
                      key={item.id || idx}
                      className="border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50"
                    >
                      <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.Pincode || item.pincode}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.BranchCode || item.branchCode}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.BranchName || item.branchName}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.Cluster}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.Region || item.region}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 dark:border-[#1F1F23] gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{filteredData.length}</span> of{" "}
              <span className="font-medium">{totalRecords}</span> records
            </div>
            
            {totalRecords > itemsPerPage && (
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
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </MasterLayout>
  )
}
