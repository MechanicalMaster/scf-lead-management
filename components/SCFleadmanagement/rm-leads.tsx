"use client"

import { useState, useEffect } from "react"
import { Eye, Edit2, Search, Filter, Download, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import EditLeadModal from "./edit-lead-modal"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import db from "@/lib/db"
import { stageToFlagMap, createLeadWorkflowState } from "@/lib/lead-workflow"
import { differenceInDays } from "date-fns"
import { ProcessedLead, LeadWorkflowState, HierarchyMaster, RMBranch } from "@/lib/db"
import { safeDbOperation } from "@/lib/db-init"
import { runLeadEscalationManually } from "@/lib/task-scheduler"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  lastUpdated: string
  ageingBucket: string
  lastActionDate: string
  flag: string
  currentStage: string
  smartfinLeadId: string  // Make it required but handle undefined in implementation
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

export default function RMLeads() {
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
  
  // State for escalation process
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalationResult, setEscalationResult] = useState<{
    processed: number;
    escalated: number;
    reminded: number;
    errors: number;
  } | null>(null)
  const [showEscalationAlert, setShowEscalationAlert] = useState(false)

  // Set mounted flag on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch leads data based on user role
  useEffect(() => {
    // Skip fetching on server-side or if not mounted
    if (!isBrowser() || !mounted) return;
    
    const fetchLeads = async () => {
      if (!user || !userRole) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        let processedLeads: ProcessedLead[] = [];
        
        // Fetch leads based on user role safely
        if (userRole === "admin" || userRole === "psm") {
          // Admin and PSM can see all leads
          processedLeads = await safeDbOperation(
            () => db.processed_leads.toArray(),
            [] // Empty array as fallback
          );
        } else if (userRole === "rm") {
          // RM can only see their assigned leads
          processedLeads = await safeDbOperation(
            () => db.processed_leads
              .where("assignedRmAdid")
              .equals(user.id)
              .toArray(),
            [] // Empty array as fallback
          );
        }
        
        // If no leads found, set empty array
        if (processedLeads.length === 0) {
          setActualLeads([]);
          setIsLoading(false);
          return;
        }
        
        // Create a map to hold RM names for efficient lookup
        const rmNamesMap = new Map<string, string>();
        
        // Process each lead to get workflow state and RM name
        const leadsPromises = processedLeads.map(async (processedLead) => {
          try {
            // Get workflow state for this lead safely
            let workflowState = await safeDbOperation(
              () => db.lead_workflow_states
                .where("processedLeadId")
                .equals(processedLead.id)
                .first(),
              undefined
            );
            
            // If workflow state doesn't exist, create a default one
            if (!workflowState) {
              console.warn(`No workflow state found for lead ${processedLead.id}, creating a default one`);
              try {
                // Get PSM ADID from the assigned anchor if available
                let psmAdid = "unknown";
                if (processedLead.anchorNameSelected) {
                  const anchorRecord = await safeDbOperation(
                    () => db.anchor_master
                      .where("anchorname")
                      .equals(processedLead.anchorNameSelected)
                      .first(),
                    undefined
                  );
                  
                  if (anchorRecord && anchorRecord.PSMADID) {
                    psmAdid = anchorRecord.PSMADID;
                  }
                }
                
                // Create a new workflow state
                workflowState = await createLeadWorkflowState(
                  processedLead.id,
                  processedLead.assignedRmAdid || "unassigned",
                  psmAdid
                );
                
                console.log(`Created new workflow state for lead ${processedLead.id}`);
              } catch (err) {
                console.error(`Failed to create workflow state for lead ${processedLead.id}:`, err);
                return null;
              }
            }
            
            // Get RM name if not already in the map
            let rmName = "N/A";
            if (processedLead.assignedRmAdid) {
              const rmId = processedLead.assignedRmAdid; // Store in a variable to avoid null
              if (rmNamesMap.has(rmId)) {
                rmName = rmNamesMap.get(rmId) || "N/A";
              } else {
                // Try to find RM in RMBranch table first safely
                const rmRecord = await safeDbOperation(
                  () => db.rm_branch
                    .where("rmId")
                    .equals(rmId)
                    .first(),
                  undefined
                );
                
                if (rmRecord) {
                  rmName = rmRecord.rmName;
                  rmNamesMap.set(rmId, rmName);
                } else {
                  // If not found, try the HierarchyMaster table safely
                  const hierarchyRecord = await safeDbOperation(
                    () => db.hierarchy_master
                      .where("empAdid")
                      .equals(rmId)
                      .first(),
                    undefined
                  );
                  
                  if (hierarchyRecord) {
                    rmName = hierarchyRecord.employeeName;
                    rmNamesMap.set(rmId, rmName);
                  }
                }
              }
            }
            
            // Calculate ageing bucket
            const ageingBucket = calculateAgeingBucket(workflowState.createdAt);
            
            // Get the display flag from the stage
            const displayFlag = stageToFlagMap[workflowState.currentStage] || "Under Progress";
            
            // Format the lastActionDate
            let lastActionDate = "N/A";
            if (workflowState.lastCommunicationTimestamp) {
              try {
                const date = new Date(workflowState.lastCommunicationTimestamp);
                lastActionDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              } catch (error) {
                console.error("Error formatting date:", error);
              }
            }
            
            // Return the lead object with combined data
            const leadData = {
              id: processedLead.id,
              processedLeadId: processedLead.id,
              workflowStateId: workflowState.id,
              dealerName: processedLead.originalData["Name of the Firm"] || "Unknown",
              anchorName: String(processedLead.anchorNameSelected || "Unknown"),
              rmName: rmName,
              rmId: processedLead.assignedRmAdid || "",
              lastUpdated: workflowState.updatedAt,
              ageingBucket: ageingBucket,
              lastActionDate: lastActionDate,
              flag: displayFlag,
              currentStage: workflowState.currentStage,
              // @ts-ignore - TypeScript incorrectly infers smartfinLeadId as possibly undefined
              // despite it being defined as string in the database schema.
              // This is a typing issue, not a functional one.
              smartfinLeadId: processedLead.smartfinLeadId || ""
            };
            
            return leadData as Lead;
          } catch (error) {
            console.error(`Error processing lead ${processedLead.id}:`, error);
            return null;
          }
        });
        
        // Wait for all promises to resolve and filter out null values
        const resolvedLeads = (await Promise.all(leadsPromises)).filter(
          (lead): lead is Lead => lead !== null
        );
        
        // Use a separate, properly typed array for state update
        const typedLeads: Lead[] = resolvedLeads.map(lead => ({
          ...lead,
          smartfinLeadId: lead.smartfinLeadId || ""
        }));
        
        setActualLeads(typedLeads);
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError("Failed to fetch leads. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeads();
  }, [user, userRole, mounted]);

  // Skip rendering until mounted to prevent hydration mismatch
  if (!mounted && isBrowser()) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RM Leads</h1>
          <div className="animate-pulse h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

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
      lead.ageingBucket.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.flag.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    // Handle undefined values during comparison
    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return sortDirection === "asc" ? -1 : 1
    if (bValue === undefined) return sortDirection === "asc" ? 1 : -1

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
    // Re-trigger the useEffect by setting isLoading to true
    setIsLoading(true);
  };

  const SortIcon = ({ field }: { field: keyof Lead }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  // Handle running the escalation process
  const handleRunEscalation = async () => {
    if (!userRole || (userRole !== 'admin' && userRole !== 'psm')) {
      return; // Only admin and PSM can run escalation
    }
    
    try {
      setIsEscalating(true);
      setEscalationResult(null);
      
      const result = await runLeadEscalationManually();
      
      setEscalationResult(result);
      setShowEscalationAlert(true);
      
      // Auto-hide the alert after 10 seconds
      setTimeout(() => {
        setShowEscalationAlert(false);
      }, 10000);
      
      // Refresh the leads data
      await refreshLeads();
    } catch (error) {
      console.error('Error running escalation process:', error);
      setError('Failed to run escalation process');
    } finally {
      setIsEscalating(false);
    }
  };
  
  // Render the escalation alert
  const renderEscalationAlert = () => {
    if (!showEscalationAlert || !escalationResult) return null;
    
    return (
      <Alert className="mb-4 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-900/30">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <AlertTitle>Escalation Process Completed</AlertTitle>
        <AlertDescription>
          Processed {escalationResult.processed} leads: 
          {escalationResult.escalated} escalated, 
          {escalationResult.reminded} reminded, 
          {escalationResult.errors} errors.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RM Leads</h1>
        <div className="flex gap-2">
          {(userRole === 'admin' || userRole === 'psm') && (
            <Button 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={handleRunEscalation}
              disabled={isEscalating}
            >
              <AlertTriangle className="h-4 w-4" />
              {isEscalating ? 'Processing...' : 'Run Escalation Process'}
            </Button>
          )}
        </div>
      </div>

      {renderEscalationAlert()}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
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
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setSearchTerm("")}>All Leads</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("With RM")}>With RM</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("Escalation 1")}>Escalation 1</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("Escalation 2")}>Escalation 2</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("With PSM")}>With PSM</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("Under Progress")}>Under Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("Dropped")}>Dropped</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("0-7 days")}>0-7 days</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("8-14 days")}>8-14 days</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("15-30 days")}>15-30 days</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("31-60 days")}>31-60 days</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("60+ days")}>60+ days</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" />
          Export
        </Button>
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
                  onClick={() => handleSort("smartfinLeadId")}
                >
                  <div className="flex items-center">
                    Smartfin Lead ID
                    <SortIcon field="smartfinLeadId" />
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
                  onClick={() => handleSort("ageingBucket")}
                >
                  <div className="flex items-center">
                    Ageing Bucket
                    <SortIcon field="ageingBucket" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Last Action Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Flag</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Loading leads...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-red-500 dark:text-red-400">
                    {error}
                  </td>
                </tr>
              ) : sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No leads found.
                  </td>
                </tr>
              ) : (
                sortedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.smartfinLeadId}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.dealerName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.anchorName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.rmName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.ageingBucket}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.lastActionDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          flagColors[lead.flag as keyof typeof flagColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                        )}
                      >
                        {lead.flag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Link href={`/lead-details/${lead.id}`} className="inline-flex">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(lead)}>
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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