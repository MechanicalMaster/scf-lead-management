"use client"

import { useState } from "react"
import { Eye, Edit2, Search, Filter, Download, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import EditLeadModal from "./edit-lead-modal"

interface Lead {
  id: string
  dealerId: string
  anchorId: string
  rmName: string
  psmName: string
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost"
  lastUpdated: string
}

const LEADS_DATA: Lead[] = [
  {
    id: "LD-001",
    dealerId: "DLR-5678",
    anchorId: "ANC-1234",
    rmName: "John Smith",
    psmName: "Alex Williams",
    status: "New",
    lastUpdated: "2025-03-28",
  },
  {
    id: "LD-002",
    dealerId: "DLR-9012",
    anchorId: "ANC-5678",
    rmName: "Sarah Johnson",
    psmName: "Mike Thompson",
    status: "Contacted",
    lastUpdated: "2025-03-27",
  },
  {
    id: "LD-003",
    dealerId: "DLR-3456",
    anchorId: "ANC-9012",
    rmName: "Michael Brown",
    psmName: "Lisa Anderson",
    status: "Qualified",
    lastUpdated: "2025-03-26",
  },
  {
    id: "LD-004",
    dealerId: "DLR-7890",
    anchorId: "ANC-3456",
    rmName: "Emily Davis",
    psmName: "James Wilson",
    status: "Proposal",
    lastUpdated: "2025-03-25",
  },
  {
    id: "LD-005",
    dealerId: "DLR-1234",
    anchorId: "ANC-7890",
    rmName: "David Wilson",
    psmName: "Sarah Thompson",
    status: "Negotiation",
    lastUpdated: "2025-03-24",
  },
  {
    id: "LD-006",
    dealerId: "DLR-5678",
    anchorId: "ANC-1234",
    rmName: "Jennifer Lee",
    psmName: "Robert Johnson",
    status: "Closed Won",
    lastUpdated: "2025-03-23",
  },
  {
    id: "LD-007",
    dealerId: "DLR-9012",
    anchorId: "ANC-5678",
    rmName: "Robert Taylor",
    psmName: "Emma Brown",
    status: "Closed Lost",
    lastUpdated: "2025-03-22",
  },
]

const statusColors = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Qualified: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Proposal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  Negotiation: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Closed Won": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Closed Lost": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export default function PSMLeads() {
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
      lead.dealerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.anchorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.rmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.psmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status.toLowerCase().includes(searchTerm.toLowerCase()),
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PSM Leads</h1>

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

          {/* Assigned to me Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                Assigned to me
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Assigned to me</DropdownMenuItem>
              <DropdownMenuItem>Unassigned</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>All Leads</DropdownMenuItem>
              <DropdownMenuItem>New Leads</DropdownMenuItem>
              <DropdownMenuItem>Contacted</DropdownMenuItem>
              <DropdownMenuItem>Qualified</DropdownMenuItem>
              <DropdownMenuItem>Proposal</DropdownMenuItem>
              <DropdownMenuItem>Negotiation</DropdownMenuItem>
              <DropdownMenuItem>Closed Won</DropdownMenuItem>
              <DropdownMenuItem>Closed Lost</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  onClick={() => handleSort("dealerId")}
                >
                  <div className="flex items-center">
                    Dealer ID
                    <SortIcon field="dealerId" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("anchorId")}
                >
                  <div className="flex items-center">
                    Anchor ID
                    <SortIcon field="anchorId" />
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
                  onClick={() => handleSort("psmName")}
                >
                  <div className="flex items-center">
                    PSM Name
                    <SortIcon field="psmName" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("lastUpdated")}
                >
                  <div className="flex items-center">
                    Last Updated
                    <SortIcon field="lastUpdated" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
              {sortedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.dealerId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.anchorId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.rmName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.psmName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        statusColors[lead.status]
                      )}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.lastUpdated}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit Lead"
                      onClick={() => handleEdit(lead)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <EditLeadModal lead={selectedLead} isOpen={isEditModalOpen} onClose={handleCloseModal} />
      )}
    </div>
  )
}
