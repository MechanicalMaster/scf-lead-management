"use client"

import { useState, useEffect } from "react"
import { Eye, Edit2, Search, Filter, Download, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import EditLeadModal from "./edit-lead-modal"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import db from "@/lib/db"
import { stageToFlagMap } from "@/lib/lead-workflow"
import { differenceInDays } from "date-fns"
import { ProcessedLead, LeadWorkflowState } from "@/lib/db"
import { safeDbOperation } from "@/lib/db-init"

// Check if we're in a browser environment safely
const isBrowser = () => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.document !== 'undefined';
  } catch (e) {
    return false;
  }
};

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

const flagColors = {
  "With RM": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Escalation 1": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Escalation 2": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "With PSM": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Under Progress": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Dropped": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

// Helper function to calculate ageing bucket
const calculateAgeingBucket = (createdAt: string): string => {
  const createdDate = new Date(createdAt);
  const currentDate = new Date();
  const daysDifference = differenceInDays(currentDate, createdDate);

  if (daysDifference <= 7) return "0-7 days";
  if (daysDifference <= 14) return "8-14 days";
  if (daysDifference <= 30) return "15-30 days";
  if (daysDifference <= 60) return "31-60 days";
  return "60+ days";
};

export default function PSMLeads() {
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
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')

  // Set mounted flag on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch leads data for PSM - specifically leads requiring PSM action
  useEffect(() => {
    // Skip fetching on server-side or if not mounted
    if (!isBrowser() || !mounted) return;
    
    const fetchPSMActionableLeads = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all workflow states where currentStage is related to PSM action
        const psmActionableStages = ['PSM_ReviewPending', 'PSM_Assigned', 'PSM_AwaitingAction', 'Dropped'];
        
        // Get all workflow states with PSM-related stages
        const psmWorkflowStates = await safeDbOperation(
          () => db.lead_workflow_states
            .where("currentStage")
            .anyOf(psmActionableStages)
            .toArray(),
          [] // Empty array as fallback
        );
        
        console.log(`Found ${psmWorkflowStates.length} PSM actionable leads`);
        
        // Filter by PSM ID if user is a PSM and 'assigned' filter is active
        let filteredWorkflowStates = psmWorkflowStates;
        
        if (userRole === "psm" && assignedFilter === 'assigned' && user.id) {
          filteredWorkflowStates = psmWorkflowStates.filter(
            state => state.psmAdid === user.id
          );
          console.log(`Filtered to ${filteredWorkflowStates.length} leads assigned to PSM ${user.id}`);
        }
        
        // Create a map to hold RM and PSM names for efficient lookup
        const rmNamesMap = new Map<string, string>();
        const psmNamesMap = new Map<string, string>();
        
        // Process each workflow state to get the associated processed lead
        const leadsPromises = filteredWorkflowStates.map(async (workflowState) => {
          try {
            // Get processed lead for this workflow state
            const processedLead = await safeDbOperation(
              () => db.processed_leads
                .get(workflowState.processedLeadId),
              null
            );
            
            if (!processedLead) {
              console.warn(`No processed lead found for workflow state ${workflowState.id}`);
              return null;
            }
            
            // Get RM name if not already in the map
            let rmName = "N/A";
            let rmId = processedLead.assignedRmAdid || "unassigned";
            
            if (rmNamesMap.has(rmId)) {
              rmName = rmNamesMap.get(rmId) || "N/A";
            } else {
              // Try to find RM in RMBranch table first
              const rmRecord = await safeDbOperation(
                () => db.rm_branch
                  .where("rmId")
                  .equals(rmId)
                  .first(),
                null
              );
              
              if (rmRecord) {
                rmName = rmRecord.rmName;
                rmNamesMap.set(rmId, rmName);
              } else {
                // If not found, try the HierarchyMaster table
                const hierarchyRecord = await safeDbOperation(
                  () => db.hierarchy_master
                    .where("empAdid")
                    .equals(rmId)
                    .first(),
                  null
                );
                
                if (hierarchyRecord) {
                  rmName = hierarchyRecord.employeeName;
                  rmNamesMap.set(rmId, rmName);
                }
              }
            }
            
            // Get PSM name if not already in the map
            let psmName = "N/A";
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
                  psmName = hierarchyRecord.employeeName;
                  psmNamesMap.set(psmId, psmName);
                }
              }
            }
            
            // Map flag from current stage
            const flag = stageToFlagMap[workflowState.currentStage] || "Unknown";
            
            // Get dealer name from original data
            const dealerName = processedLead.originalData["Name of the Firm"] || "Unknown Dealer";
            
            // Format the lead object
            return {
              id: workflowState.id, // Using workflow state ID as the lead ID for display
              processedLeadId: processedLead.id,
              workflowStateId: workflowState.id,
              dealerName,
              anchorName: processedLead.anchorNameSelected,
              rmName,
              rmId,
              psmName,
              psmId,
              lastUpdated: workflowState.updatedAt,
              ageingBucket: calculateAgeingBucket(workflowState.createdAt),
              lastActionDate: workflowState.lastCommunicationTimestamp.split('T')[0],
              flag,
              currentStage: workflowState.currentStage,
            };
          } catch (error) {
            console.error(`Error processing workflow state ${workflowState.id}:`, error);
            return null;
          }
        });
        
        // Wait for all promises to resolve
        const leadResults = await Promise.all(leadsPromises);
        
        // Filter out null results
        const validLeads = leadResults.filter(lead => lead !== null) as Lead[];
        
        setActualLeads(validLeads);
      } catch (error) {
        console.error("Error fetching PSM actionable leads:", error);
        setError("Failed to load leads. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call the fetch function
    fetchPSMActionableLeads();
  }, [user, userRole, assignedFilter, mounted]);

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredLeads = actualLeads.filter(
    (lead) =>
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.dealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.anchorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.rmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.psmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.flag.toLowerCase().includes(searchTerm.toLowerCase()),
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
  
  const refreshLeads = async () => {
    // Reset filter and reload leads
    setIsLoading(true);
    // This will trigger the useEffect to reload data
    setAssignedFilter(assignedFilter);
  };

  const SortIcon = ({ field }: { field: keyof Lead }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads for PSM Review</h1>

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
                {assignedFilter === 'assigned' ? 'Assigned to me' : assignedFilter === 'unassigned' ? 'Unassigned' : 'All leads'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setAssignedFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignedFilter('assigned')}>Assigned to me</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignedFilter('unassigned')}>Unassigned</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : actualLeads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No dropped leads found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are currently no leads requiring PSM review or action.
          </p>
        </div>
      ) : (
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
                    onClick={() => handleSort("psmName")}
                  >
                    <div className="flex items-center">
                      PSM Name
                      <SortIcon field="psmName" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                    onClick={() => handleSort("flag")}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="flag" />
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
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                {sortedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.processedLeadId.substring(0, 8)}...</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.dealerName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.anchorName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.rmName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.psmName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          flagColors[lead.flag as keyof typeof flagColors] || flagColors["Dropped"]
                        )}
                      >
                        {lead.flag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.lastActionDate}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View Details"
                      >
                        <Link href={`/lead-details/${lead.processedLeadId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
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
      )}

      {selectedLead && (
        <EditLeadModal 
          lead={selectedLead} 
          isOpen={isEditModalOpen} 
          onClose={handleCloseModal}
          onSave={refreshLeads}
        />
      )}
    </div>
  )
}
