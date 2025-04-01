"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter } from "lucide-react"
import MasterLayout from "./master-layout"

interface Anchor {
  id: string
  anchorId: string
  anchorName: string
  industry: string
  creditRating: string
  creditLimit: string
  region: string
  rmId: string
  rmName: string
  active: boolean
}

const ANCHOR_DATA: Anchor[] = [
  {
    id: "1",
    anchorId: "ANC001",
    anchorName: "Reliance Industries Ltd",
    industry: "Petrochemicals",
    creditRating: "AAA",
    creditLimit: "₹500,00,00,000",
    region: "West",
    rmId: "RM001",
    rmName: "Rajesh Kumar",
    active: true,
  },
  {
    id: "2",
    anchorId: "ANC002",
    anchorName: "Tata Steel Ltd",
    industry: "Steel",
    creditRating: "AA+",
    creditLimit: "₹300,00,00,000",
    region: "East",
    rmId: "RM005",
    rmName: "Sanjay Ghosh",
    active: true,
  },
  {
    id: "3",
    anchorId: "ANC003",
    anchorName: "Infosys Ltd",
    industry: "IT",
    creditRating: "AAA",
    creditLimit: "₹250,00,00,000",
    region: "South",
    rmId: "RM004",
    rmName: "Deepa Nair",
    active: true,
  },
  {
    id: "4",
    anchorId: "ANC004",
    anchorName: "Bharti Airtel Ltd",
    industry: "Telecom",
    creditRating: "AA",
    creditLimit: "₹200,00,00,000",
    region: "North",
    rmId: "RM003",
    rmName: "Amit Sharma",
    active: true,
  },
  {
    id: "5",
    anchorId: "ANC005",
    anchorName: "Mahindra & Mahindra Ltd",
    industry: "Automotive",
    creditRating: "AA+",
    creditLimit: "₹180,00,00,000",
    region: "West",
    rmId: "RM002",
    rmName: "Priya Singh",
    active: false,
  },
]

export default function AnchorMaster() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = ANCHOR_DATA.filter(
    (item) =>
      item.anchorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.anchorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MasterLayout
      title="Anchor Master"
      description="Manage anchor entities and their details"
      lastUpdated={{
        date: "Mar 29, 2025, 4:30 PM",
        user: "Emily Davis",
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search by anchor, industry..."
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
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Anchor ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Anchor Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Industry</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Credit Rating</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Credit Limit</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Region</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RM Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.anchorId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.anchorName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.industry}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.creditRating}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.creditLimit}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.region}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.rmName}</td>
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
            <span className="font-medium">{ANCHOR_DATA.length}</span> records
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

