"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter } from "lucide-react"
import MasterLayout from "./master-layout"
import { downloadTemplate } from "@/lib/downloadTemplate"

interface PincodeBranch {
  id: string
  pincode: string
  branchCode: string
  branchName: string
  city: string
  state: string
  region: string
  active: boolean
}

const PINCODE_DATA: PincodeBranch[] = [
  {
    id: "1",
    pincode: "400001",
    branchCode: "MUM001",
    branchName: "Mumbai Fort",
    city: "Mumbai",
    state: "Maharashtra",
    region: "West",
    active: true,
  },
  {
    id: "2",
    pincode: "400051",
    branchCode: "MUM002",
    branchName: "Andheri",
    city: "Mumbai",
    state: "Maharashtra",
    region: "West",
    active: true,
  },
  {
    id: "3",
    pincode: "110001",
    branchCode: "DEL001",
    branchName: "Connaught Place",
    city: "New Delhi",
    state: "Delhi",
    region: "North",
    active: true,
  },
  {
    id: "4",
    pincode: "600001",
    branchCode: "CHE001",
    branchName: "Chennai Central",
    city: "Chennai",
    state: "Tamil Nadu",
    region: "South",
    active: true,
  },
  {
    id: "5",
    pincode: "700001",
    branchCode: "KOL001",
    branchName: "Kolkata Central",
    city: "Kolkata",
    state: "West Bengal",
    region: "East",
    active: true,
  },
  {
    id: "6",
    pincode: "500001",
    branchCode: "HYD001",
    branchName: "Hyderabad Central",
    city: "Hyderabad",
    state: "Telangana",
    region: "South",
    active: false,
  },
]

export default function PincodeBranchMaster() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = PINCODE_DATA.filter(
    (item) =>
      item.pincode.includes(searchTerm) ||
      item.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.state.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MasterLayout
      title="Pincode Branch Master"
      description="Manage the mapping between pincodes and branches"
      lastUpdated={{
        date: "Apr 1, 2025, 10:23 AM",
        user: "John Smith",
      }}
    >
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => downloadTemplate([
            "Pincode",
            "Branch Code",
            "Branch Name",
            "City",
            "State",
            "Region",
            "Status"
          ], "pincode_branch_template.xlsx")}
        >
          Download Template
        </Button>
      </div>
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
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Pincode</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Branch Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Branch Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">City</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">State</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Region</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.pincode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.branchCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.branchName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.city}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.state}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.region}</td>
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
            <span className="font-medium">{PINCODE_DATA.length}</span> records
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
