"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter } from "lucide-react"
import MasterLayout from "./master-layout"
import { downloadTemplate } from "@/lib/downloadTemplate"

interface Hierarchy {
  empAdid: string
  fullName: string
  rblAdid: string
  rblName: string
  region: string
  zhAdid: string
  zhName: string
  yesEmail: string
  mobile: string
}

const HIERARCHY_DATA: Hierarchy[] = [
  {
    empAdid: "EMP001",
    fullName: "Vikram Mehta",
    rblAdid: "RBL001",
    rblName: "RBL Name 1",
    region: "North",
    zhAdid: "ZH001",
    zhName: "ZH Name 1",
    yesEmail: "vikram.mehta@yesbank.in",
    mobile: "9876543210",
  },
  {
    empAdid: "EMP002",
    fullName: "Neha Gupta",
    rblAdid: "RBL002",
    rblName: "RBL Name 2",
    region: "West",
    zhAdid: "ZH002",
    zhName: "ZH Name 2",
    yesEmail: "neha.gupta@yesbank.in",
    mobile: "9123456780",
  },
  {
    empAdid: "EMP003",
    fullName: "Rahul Sharma",
    rblAdid: "RBL003",
    rblName: "RBL Name 3",
    region: "South",
    zhAdid: "ZH003",
    zhName: "ZH Name 3",
    yesEmail: "rahul.sharma@yesbank.in",
    mobile: "9999999999",
  },
  {
    empAdid: "EMP004",
    fullName: "Priya Patel",
    rblAdid: "RBL004",
    rblName: "RBL Name 4",
    region: "East",
    zhAdid: "ZH004",
    zhName: "ZH Name 4",
    yesEmail: "priya.patel@yesbank.in",
    mobile: "8888888888",
  },
  {
    empAdid: "EMP005",
    fullName: "Anil Kumar",
    rblAdid: "RBL005",
    rblName: "RBL Name 5",
    region: "North",
    zhAdid: "ZH005",
    zhName: "ZH Name 5",
    yesEmail: "anil.kumar@yesbank.in",
    mobile: "7777777777",
  },
]

export default function HierarchyMaster() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = HIERARCHY_DATA.filter(
    (item) =>
      item.empAdid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rblAdid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rblName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.zhAdid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.zhName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.yesEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MasterLayout
      title="Hierarchy Master"
      description="Manage the organizational hierarchy structure"
      lastUpdated={{
        date: "Mar 30, 2025, 11:15 AM",
        user: "Michael Brown",
      }}
    >
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => downloadTemplate([
            "Emp ADID",
            "Full Name",
            "RBL ADID",
            "RBL Name",
            "Region",
            "ZH ADID",
            "ZH Name",
            "Yes Email",
            "Mobile"
          ], "hierarchy_template.xlsx")}
        >
          Download Template
        </Button>
      </div>
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
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Emp ADID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Full Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RBL ADID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RBL Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Region</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ZH ADID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ZH Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Yes Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr
                  key={item.empAdid + idx}
                  className="border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.empAdid}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.fullName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.rblAdid}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.rblName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.region}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.zhAdid}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.zhName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.yesEmail}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#1F1F23]">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{filteredData.length}</span> of{" "}
            <span className="font-medium">{HIERARCHY_DATA.length}</span> records
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
