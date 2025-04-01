"use client"

import { useState } from "react"
import { Search, Filter, Download, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LeadSummary {
  id: string
  dealerId: string
  anchorId: string
  rmName: string
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost"
  lastUpdated: string
  priority: "High" | "Medium" | "Low"
  psmName?: string
  regionName?: string
  zhName?: string
}

const PSM_LEADS_DATA: LeadSummary[] = [
  {
    id: "LD-001",
    dealerId: "DLR-5678",
    anchorId: "ANC-1234",
    rmName: "John Smith",
    status: "New",
    lastUpdated: "2025-03-28",
    priority: "High",
    psmName: "Alex Williams",
  },
  {
    id: "LD-002",
    dealerId: "DLR-9012",
    anchorId: "ANC-5678",
    rmName: "Sarah Johnson",
    status: "Contacted",
    lastUpdated: "2025-03-27",
    priority: "Medium",
    psmName: "Mike Thompson",
  },
  {
    id: "LD-003",
    dealerId: "DLR-3456",
    anchorId: "ANC-9012",
    rmName: "Michael Brown",
    status: "Qualified",
    lastUpdated: "2025-03-26",
    priority: "High",
    psmName: "Lisa Anderson",
  },
]

const REGION_LEADS_DATA: LeadSummary[] = [
  {
    id: "LD-004",
    dealerId: "DLR-7890",
    anchorId: "ANC-3456",
    rmName: "Emily Davis",
    status: "Proposal",
    lastUpdated: "2025-03-25",
    priority: "Medium",
    regionName: "North",
  },
  {
    id: "LD-005",
    dealerId: "DLR-1234",
    anchorId: "ANC-7890",
    rmName: "David Wilson",
    status: "Negotiation",
    lastUpdated: "2025-03-24",
    priority: "High",
    regionName: "South",
  },
]

const ZH_LEADS_DATA: LeadSummary[] = [
  {
    id: "LD-006",
    dealerId: "DLR-5678",
    anchorId: "ANC-1234",
    rmName: "Jennifer Lee",
    status: "Closed Won",
    lastUpdated: "2025-03-23",
    priority: "Low",
    zhName: "Central ZH",
  },
  {
    id: "LD-007",
    dealerId: "DLR-9012",
    anchorId: "ANC-5678",
    rmName: "Robert Taylor",
    status: "Closed Lost",
    lastUpdated: "2025-03-22",
    priority: "Low",
    zhName: "Eastern ZH",
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

const priorityColors = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
}

export default function LeadSummary() {
  const [selectedTab, setSelectedTab] = useState("psm")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof LeadSummary | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  const handleSort = (field: keyof LeadSummary) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get the appropriate data based on the selected tab
  const getLeadData = () => {
    switch (selectedTab) {
      case "psm":
        return PSM_LEADS_DATA
      case "region":
        return REGION_LEADS_DATA
      case "zh":
        return ZH_LEADS_DATA
      default:
        return PSM_LEADS_DATA
    }
  }

  const SortIcon = ({ field }: { field: keyof LeadSummary }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  // Filter and sort the leads
  const filteredLeads = getLeadData().filter(
    (lead) =>
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.dealerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.anchorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.rmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Helper function to render the leads table
  const renderLeadsTable = (leads: LeadSummary[]) => {
    return (
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
                {selectedTab === "psm" && (
                  <th
                    className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                    onClick={() => handleSort("psmName")}
                  >
                    <div className="flex items-center">
                      PSM Name
                      <SortIcon field="psmName" />
                    </div>
                  </th>
                )}
                {selectedTab === "region" && (
                  <th
                    className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                    onClick={() => handleSort("regionName")}
                  >
                    <div className="flex items-center">
                      Region
                      <SortIcon field="regionName" />
                    </div>
                  </th>
                )}
                {selectedTab === "zh" && (
                  <th
                    className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                    onClick={() => handleSort("zhName")}
                  >
                    <div className="flex items-center">
                      ZH
                      <SortIcon field="zhName" />
                    </div>
                  </th>
                )}
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
                <th
                  className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center">
                    Priority
                    <SortIcon field="priority" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.dealerId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.anchorId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.rmName}</td>
                  {selectedTab === "psm" && (
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.psmName}</td>
                  )}
                  {selectedTab === "region" && (
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.regionName}</td>
                  )}
                  {selectedTab === "zh" && (
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.zhName}</td>
                  )}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Summary</h1>

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
              <DropdownMenuItem>New Leads</DropdownMenuItem>
              <DropdownMenuItem>Contacted</DropdownMenuItem>
              <DropdownMenuItem>Qualified</DropdownMenuItem>
              <DropdownMenuItem>Proposal</DropdownMenuItem>
              <DropdownMenuItem>Negotiation</DropdownMenuItem>
              <DropdownMenuItem>Closed Won</DropdownMenuItem>
              <DropdownMenuItem>Closed Lost</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs 
            defaultValue="psm" 
            value={selectedTab} 
            onValueChange={(value) => setSelectedTab(value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="psm">PSM</TabsTrigger>
              <TabsTrigger value="region">Region</TabsTrigger>
              <TabsTrigger value="zh">ZH</TabsTrigger>
            </TabsList>
            
            <TabsContent value="psm">
              {renderLeadsTable(sortedLeads)}
            </TabsContent>
            
            <TabsContent value="region">
              {renderLeadsTable(sortedLeads)}
            </TabsContent>
            
            <TabsContent value="zh">
              {renderLeadsTable(sortedLeads)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 