"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter } from "lucide-react"
import MasterLayout from "./master-layout"

interface RMBranch {
  id: string
  rmId: string
  rmName: string
  branchCode: string
  branchName: string
  region: string
  role: string
  active: boolean
}

const RM_BRANCH_DATA: RMBranch[] = [
  {
    id: "1",
    rmId: "RM001",
    rmName: "Rajesh Kumar",
    branchCode: "MUM001",
    branchName: "Mumbai Fort",
    region: "West",
    role: "Senior RM",
    active: true,
  },
  {
    id: "2",
    rmId: "RM002",
    rmName: "Priya Singh",
    branchCode: "MUM002",
    branchName: "Andheri",
    region: "West",
    role: "RM",
    active: true,
  },
  {
    id: "3",
    rmId: "RM003",
    rmName: "Amit Sharma",
    branchCode: "DEL001",
    branchName: "Connaught Place",
    region: "North",
    role: "Senior RM",
    active: true,
  },
  {
    id: "4",
    rmId: "RM004",
    rmName: "Deepa Nair",
    branchCode: "CHE001",
    branchName: "Chennai Central",
    region: "South",
    role: "RM",
    active: true,
  },
  {
    id: "5",
    rmId: "RM005",
    rmName: "Sanjay Ghosh",
    branchCode: "KOL001",
    branchName: "Kolkata Central",
    region: "East",
    role: "Senior RM",
    active: false,
  },
]

export default function RMBranchMaster() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = RM_BRANCH_DATA.filter(
    (item) =>
      item.rmId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MasterLayout
      title="RM Branch Master"
      description="Manage the mapping between relationship managers and branches"
      lastUpdated={{
        date: "Mar 28, 2025, 2:45 PM",
        user: "Sarah Johnson",
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search by RM, branch..."
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

          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RM ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RM Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Branch Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Branch Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Region</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.rmId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.rmName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.branchCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.branchName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.region}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#1F1F23]">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{filteredData.length}</span> of{" "}
            <span className="font-medium">{RM_BRANCH_DATA.length}</span> records
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </MasterLayout>
  )
}

