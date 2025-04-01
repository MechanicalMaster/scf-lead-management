"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter } from "lucide-react"
import MasterLayout from "./master-layout"

interface Hierarchy {
  id: string
  employeeId: string
  employeeName: string
  designation: string
  reportingTo: string
  reportingManager: string
  department: string
  level: number
  active: boolean
}

const HIERARCHY_DATA: Hierarchy[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "Vikram Mehta",
    designation: "Regional Head",
    reportingTo: "EMP000",
    reportingManager: "CEO",
    department: "Sales",
    level: 1,
    active: true,
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Neha Gupta",
    designation: "Branch Manager",
    reportingTo: "EMP001",
    reportingManager: "Vikram Mehta",
    department: "Sales",
    level: 2,
    active: true,
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "Rahul Sharma",
    designation: "Team Lead",
    reportingTo: "EMP002",
    reportingManager: "Neha Gupta",
    department: "Sales",
    level: 3,
    active: true,
  },
  {
    id: "4",
    employeeId: "EMP004",
    employeeName: "Priya Patel",
    designation: "Senior RM",
    reportingTo: "EMP003",
    reportingManager: "Rahul Sharma",
    department: "Sales",
    level: 4,
    active: true,
  },
  {
    id: "5",
    employeeId: "EMP005",
    employeeName: "Anil Kumar",
    designation: "RM",
    reportingTo: "EMP003",
    reportingManager: "Rahul Sharma",
    department: "Sales",
    level: 4,
    active: false,
  },
]

export default function HierarchyMaster() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = HIERARCHY_DATA.filter(
    (item) =>
      item.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reportingManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()),
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
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Employee ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Employee Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Designation</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Reporting Manager</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Department</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Level</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.employeeId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.employeeName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.designation}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.reportingManager}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.department}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.level}</td>
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

