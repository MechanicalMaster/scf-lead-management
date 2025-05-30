"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import MasterLayout from "./master-layout"
import { MasterService } from "@/lib/db"
import type { HierarchyMaster } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function HierarchyMaster() {
  const [searchTerm, setSearchTerm] = useState("")
  const [hierarchyData, setHierarchyData] = useState<HierarchyMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load hierarchy data from IndexedDB
    const loadHierarchy = async () => {
      try {
        setLoading(true);
        const result = await MasterService.getRecords('hierarchy_master');
        
        if (result.success && result.data) {
          // Type assertion to ensure correct type
          setHierarchyData(result.data as HierarchyMaster[]);
        } else {
          setError("Failed to load hierarchy data");
        }
      } catch (err) {
        console.error("Error loading hierarchy:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadHierarchy();
  }, []);

  const filteredData = hierarchyData.filter(
    (item) =>
      item.empAdid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rblAdid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rblName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.zhAdid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.zhName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.yesEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MasterLayout
      title="Hierarchy Master"
      description="Manage the organizational hierarchy structure"
      lastUpdated={{
        date: "Mar 30, 2025, 11:15 AM",
        user: "Michael Brown",
      }}
      storeName="hierarchy_master"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search by employee, designation..."
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
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading hierarchy data...</p>
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
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Emp ADID</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Full Name</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RBL ADID</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RBL Name</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Region</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ZH ADID</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ZH Name</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Yes Email</TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Mobile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-gray-500 dark:text-gray-400">
                      {hierarchyData.length === 0 
                        ? "No hierarchy data available. Use the Upload tab to add data." 
                        : "No results found for your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, idx) => (
                    <TableRow
                      key={item.id || idx}
                      className="border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50"
                    >
                      <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.empAdid}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.fullName}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.rblAdid}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.rblName}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.region}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.zhAdid}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.zhName}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.yesEmail}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.mobile}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{filteredData.length}</span> of{" "}
              <span className="font-medium">{hierarchyData.length}</span> records
            </div>
          </div>
        </div>
      )}
    </MasterLayout>
  )
}
