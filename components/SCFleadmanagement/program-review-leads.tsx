"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, Filter, Download, CalendarIcon, CheckCircle, XCircle, ChevronUp } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import EditLeadModal from "./edit-lead-modal"

import db from "@/lib/db"
import { stageToFlagMap, getLeadWorkflowStateByProcessedLeadId } from "@/lib/lead-workflow"
import { safeDbOperation } from "@/lib/db-init"

// Flag colors for visual distinction
const flagColors: Record<string, string> = {
  "With RM": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-900/50",
  "With PSM": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-900/50",
  "Dropped": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-900/50",
  "Closed": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-900/50",
  "Program Review": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-900/50"
};

// Helper to check if we're in a browser environment
const isBrowser = () => typeof window !== "undefined";

interface Lead {
  id: string
  processedLeadId: string
  workflowStateId: string
  dealerName: string
  anchorName: string
  rmName: string
  rmId: string
  psmName: string
  psmId: string
  lastUpdated: string
  ageingBucket: string
  lastActionDate: string
  flag: string
  currentStage: string
}

export default function ProgramReviewLeads() {
  const { user, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Lead | null>("lastUpdated")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [actualLeads, setActualLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Set mounted flag on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch leads data for admin review
  useEffect(() => {
    // Skip fetching on server-side or if not mounted
    if (!isBrowser() || !mounted) return;
    
    fetchAdminReviewLeads();
  }, [mounted]);

  const fetchAdminReviewLeads = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all workflow states with AdminReviewPending stage
      const workflowStates = await safeDbOperation(() => 
        db.lead_workflow_states
          .where('currentStage')
          .equals('AdminReviewPending')
          .toArray(), 
        []
      );
      
      console.log(`[Program Review] Found ${workflowStates.length} leads in admin review stage`);
      
      // Cache for RM and PSM names to avoid duplicate lookups
      const rmNamesMap = new Map<string, string>();
      const psmNamesMap = new Map<string, string>();
      
      // Process each workflow state to get lead details
      const leadsPromises = workflowStates.map(async (workflowState) => {
        try {
          // Get the processed lead data
          const processedLead = await safeDbOperation(
            () => db.processed_leads.get(workflowState.processedLeadId),
            null
          );
          
          if (!processedLead) {
            console.warn(`[Program Review] Processed lead not found for ${workflowState.processedLeadId}`);
            return null;
          }
          
          // Get RM name from cache or lookup
          let rmName = "Unknown RM";
          let rmId = workflowState.currentAssigneeAdid;
          
          // If the lead is in admin review, the current assignee might be 'system'
          // Use the originalData to find the RM if available
          if (rmId === 'system' && processedLead.assignedRmAdid) {
            rmId = processedLead.assignedRmAdid;
          }
          
          if (rmNamesMap.has(rmId)) {
            rmName = rmNamesMap.get(rmId) || "Unknown RM";
          } else {
            // Try to find RM in hierarchy_master table
            const hierarchyRecord = await safeDbOperation(
              () => db.hierarchy_master
                .where("empAdid")
                .equals(rmId)
                .first(),
              null
            );
            
            if (hierarchyRecord) {
              rmName = hierarchyRecord.fullName || hierarchyRecord.FullName || hierarchyRecord.employeeName || "Unknown RM";
              rmNamesMap.set(rmId, rmName);
            }
          }
          
          // Get PSM name from cache or lookup
          let psmName = "Unknown PSM";
          let psmId = workflowState.psmAdid || "unassigned";
          
          if (psmNamesMap.has(psmId)) {
            psmName = psmNamesMap.get(psmId) || "N/A";
          } else {
            // Try to find PSM in anchor_master table first
            const anchorRecords = await safeDbOperation(
              () => db.anchor_master
                .where("PSMADID")
                .equals(psmId)
                .toArray(),
              []
            );
            
            if (anchorRecords.length > 0) {
              psmName = anchorRecords[0].PSMName || "N/A";
              psmNamesMap.set(psmId, psmName);
            } else {
              // If not found, try the HierarchyMaster table
              const hierarchyRecord = await safeDbOperation(
                () => db.hierarchy_master
                  .where("empAdid")
                  .equals(psmId)
                  .first(),
                null
              );
              
              if (hierarchyRecord) {
                psmName = hierarchyRecord.fullName || hierarchyRecord.FullName || hierarchyRecord.employeeName || "Unknown PSM";
                psmNamesMap.set(psmId, psmName);
              }
            }
          }
          
          // Map flag from current stage
          const flag = stageToFlagMap[workflowState.currentStage] || "Unknown";
          
          // Get dealer name and anchor name from original data
          const dealerName = processedLead.originalData["Name of the Firm"] || "Unknown Dealer";
          const anchorName = processedLead.anchorNameSelected || processedLead.originalData["Name of the Anchor"] || "Unknown Anchor";
          
          // Create a lead object
          return {
            id: processedLead.id,
            processedLeadId: processedLead.id,
            workflowStateId: workflowState.id,
            dealerName,
            anchorName,
            rmName,
            rmId,
            psmName,
            psmId,
            lastUpdated: workflowState.updatedAt,
            ageingBucket: getAgeingBucket(workflowState.updatedAt),
            lastActionDate: formatDate(workflowState.lastCommunicationTimestamp),
            flag,
            currentStage: workflowState.currentStage
          };
        } catch (err) {
          console.error(`[Program Review] Error processing workflow state ${workflowState.id}:`, err);
          return null;
        }
      });
      
      const leads = (await Promise.all(leadsPromises)).filter(lead => lead !== null) as Lead[];
      console.log(`[Program Review] Processed ${leads.length} valid leads`);
      
      setActualLeads(leads);
    } catch (err) {
      console.error("[Program Review] Error fetching admin review leads:", err);
      setError("Failed to load leads for program review. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  // Helper function to determine ageing bucket based on date
  const getAgeingBucket = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 2) return "0-2 Days";
      if (diffDays <= 5) return "3-5 Days";
      if (diffDays <= 10) return "6-10 Days";
      return "10+ Days";
    } catch {
      return "Unknown";
    }
  };

  // Filter and sort leads
  const filteredLeads = actualLeads
    .filter(lead => {
      const searchLower = searchTerm.toLowerCase();
      return (
        lead.dealerName.toLowerCase().includes(searchLower) ||
        lead.anchorName.toLowerCase().includes(searchLower) ||
        lead.rmName.toLowerCase().includes(searchLower) ||
        lead.psmName.toLowerCase().includes(searchLower) ||
        lead.flag.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle opening the edit modal
  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  // Handle sorting
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Handle view lead details
  const handleViewDetails = (leadId: string) => {
    router.push(`/lead-details/${leadId}`);
  };

  // Handle modal save
  const handleSave = () => {
    setIsEditModalOpen(false);
    fetchAdminReviewLeads(); // Refresh leads after edit
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start">
        <h1 className="text-2xl font-bold">Program Review</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage leads that require program review
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search leads..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSearchTerm("")}>
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={fetchAdminReviewLeads}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-white"></div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-4 text-center">
              <p className="text-red-800 dark:text-red-300">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={fetchAdminReviewLeads}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23]">
                  <TableHead className="px-4 py-3 text-left font-medium">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("dealerName")}
                    >
                      Dealer Name
                      {sortField === "dealerName" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("anchorName")}
                    >
                      Anchor
                      {sortField === "anchorName" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("rmName")}
                    >
                      RM
                      {sortField === "rmName" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("psmName")}
                    >
                      PSM
                      {sortField === "psmName" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("lastActionDate")}
                    >
                      Last Action
                      {sortField === "lastActionDate" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("ageingBucket")}
                    >
                      Ageing
                      {sortField === "ageingBucket" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("flag")}
                    >
                      Status
                      {sortField === "flag" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No leads requiring program review found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#1F1F23]/50 cursor-pointer"
                      onClick={() => handleViewDetails(lead.id)}
                    >
                      <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {lead.dealerName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {lead.anchorName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {lead.rmName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {lead.psmName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {lead.lastActionDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {lead.ageingBucket}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border px-2 py-0.5 text-xs font-medium",
                            flagColors[lead.flag] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                          )}
                        >
                          {lead.flag}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLead(lead);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selectedLead && (
        <EditLeadModal
          lead={selectedLead}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
} 