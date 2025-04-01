"use client"

import { useState } from "react"
import { Eye, Edit2, Search, Filter, Download, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import EditLeadModal from "./edit-lead-modal"
import Link from "next/link"

interface Lead {
  id: string
  dealerName: string
  anchorName: string
  rmName: string
  lastUpdated: string
  priority: "High" | "Medium" | "Low"
  ageingBucket: string
  lastActionDate: string
  flag: "With RM" | "Escalation 1" | "Escalation 2" | "With PSM" | "Under Progress" | "Dropped"
}

const LEADS_DATA: Lead[] = [
  {
    id: "LD-001",
    dealerName: "ABC Motors",
    anchorName: "XYZ Corp",
    rmName: "John Smith",
    lastUpdated: "2025-03-28",
    priority: "High",
    ageingBucket: "0-7 days",
    lastActionDate: "2025-03-27",
    flag: "With RM",
  },
  {
    id: "LD-002",
    dealerName: "Highway Traders",
    anchorName: "Global Industries",
    rmName: "Sarah Johnson",
    lastUpdated: "2025-03-27",
    priority: "Medium",
    ageingBucket: "0-7 days",
    lastActionDate: "2025-03-26",
    flag: "Under Progress",
  },
  {
    id: "LD-003",
    dealerName: "City Suppliers",
    anchorName: "Metro Manufacturing",
    rmName: "Michael Brown",
    lastUpdated: "2025-03-26",
    priority: "High",
    ageingBucket: "8-14 days",
    lastActionDate: "2025-03-20",
    flag: "With PSM",
  },
  {
    id: "LD-004",
    dealerName: "Urban Distributors",
    anchorName: "National Enterprises",
    rmName: "Emily Davis",
    lastUpdated: "2025-03-25",
    priority: "Medium",
    ageingBucket: "8-14 days",
    lastActionDate: "2025-03-19",
    flag: "Escalation 1",
  },
  {
    id: "LD-005",
    dealerName: "Prime Dealers",
    anchorName: "United Holdings",
    rmName: "David Wilson",
    lastUpdated: "2025-03-24",
    priority: "High",
    ageingBucket: "15-30 days",
    lastActionDate: "2025-03-15",
    flag: "Escalation 2",
  },
  {
    id: "LD-006",
    dealerName: "Sunrise Trading",
    anchorName: "Pacific Group",
    rmName: "Jennifer Lee",
    lastUpdated: "2025-03-23",
    priority: "Low",
    ageingBucket: "15-30 days",
    lastActionDate: "2025-03-10",
    flag: "With PSM",
  },
  {
    id: "LD-007",
    dealerName: "Galaxy Merchants",
    anchorName: "Global Industries",
    rmName: "Robert Taylor",
    lastUpdated: "2025-03-22",
    priority: "Low",
    ageingBucket: "31-60 days",
    lastActionDate: "2025-02-28",
    flag: "Dropped",
  },
]

const priorityColors = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
}

const flagColors = {
  "With RM": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Escalation 1": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Escalation 2": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "With PSM": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Under Progress": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Dropped": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

export default function RMLeads() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Lead | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredLeads = LEADS_DATA.filter(
    (lead) =>
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.dealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.anchorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.rmName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setSelectedLead(null)
  }

  const SortIcon = ({ field }: { field: keyof Lead }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RM Leads</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search leads..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>All Leads</DropdownMenuItem>
              <DropdownMenuItem>High Priority</DropdownMenuItem>
              <DropdownMenuItem>Medium Priority</DropdownMenuItem>
              <DropdownMenuItem>Low Priority</DropdownMenuItem>
              <DropdownMenuItem>With RM</DropdownMenuItem>
              <DropdownMenuItem>Escalation 1</DropdownMenuItem>
              <DropdownMenuItem>Escalation 2</DropdownMenuItem>
              <DropdownMenuItem>With PSM</DropdownMenuItem>
              <DropdownMenuItem>Under Progress</DropdownMenuItem>
              <DropdownMenuItem>Dropped</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center">
                    Lead ID
                    <SortIcon field="id" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("dealerName")}
                >
                  <div className="flex items-center">
                    Dealer Name
                    <SortIcon field="dealerName" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("anchorName")}
                >
                  <div className="flex items-center">
                    Anchor Name
                    <SortIcon field="anchorName" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("rmName")}
                >
                  <div className="flex items-center">
                    RM Name
                    <SortIcon field="rmName" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center">
                    Priority
                    <SortIcon field="priority" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("ageingBucket")}
                >
                  <div className="flex items-center">
                    Ageing Bucket
                    <SortIcon field="ageingBucket" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("lastActionDate")}
                >
                  <div className="flex items-center">
                    Last Action Date
                    <SortIcon field="lastActionDate" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("flag")}
                >
                  <div className="flex items-center">
                    Flag
                    <SortIcon field="flag" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
              {sortedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.dealerName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.anchorName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.rmName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        priorityColors[lead.priority]
                      )}
                    >
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.ageingBucket}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.lastActionDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        flagColors[lead.flag]
                      )}
                    >
                      {lead.flag}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/lead-details/${lead.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(lead)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#1F1F23]">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{sortedLeads.length}</span> of{" "}
            <span className="font-medium">{LEADS_DATA.length}</span> leads
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

      {isEditModalOpen && selectedLead && (
        <EditLeadModal lead={selectedLead} isOpen={isEditModalOpen} onClose={handleCloseModal} />
      )}
    </div>
  )
} 