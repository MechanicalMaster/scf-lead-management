"use client"

import { useState, useEffect } from "react"
import { 
  ArrowLeft, MessageSquare, Mail, 
  Calendar, Clock, Check, ChevronDown, ChevronUp, 
  FileText, Send, Download, Sparkles, AlertTriangle 
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { 
  LeadCommunication, 
  LeadWorkflowState, 
  getLeadWorkflowStateByProcessedLeadId,
  getLeadCommunicationsByProcessedLeadId
} from "@/lib/lead-workflow"
import { format } from "date-fns"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { safeDbOperation } from "@/lib/db-init"
import { ProcessedLead } from "@/lib/db"
import db from "@/lib/db"

interface LeadHistory {
  id: string
  date: string
  time: string
  type: "email_sent" | "email_received" | "status_change" | "note" | "system_action"
  title: string
  description: string
  fromEmail?: string
  toEmail?: string
  aiDecision?: string
  attachments?: { name: string; size: string }[]
}

interface LeadDetailsProps {
  leadId: string
}

// Mock history data - would come from API in real app
const LEAD_HISTORY: LeadHistory[] = [
  {
    id: "hist-1",
    date: "2025-03-20",
    time: "09:15 AM",
    type: "email_sent",
    title: "Lead Uploaded Email",
    description: "Initial notification sent to RM about new lead assignment",
    fromEmail: "system@scfleadmgmt.com",
    toEmail: "john.smith@example.com"
  },
  {
    id: "hist-2",
    date: "2025-03-22",
    time: "10:30 AM",
    type: "email_received",
    title: "RM Response",
    description: "I'm working on contacting this dealer. Will update by end of week.",
    fromEmail: "john.smith@example.com",
    toEmail: "system@scfleadmgmt.com",
    aiDecision: "Response acknowledged. Continue monitoring."
  },
  {
    id: "hist-3",
    date: "2025-03-27",
    time: "11:00 AM",
    type: "email_sent",
    title: "7-Day Reminder",
    description: "Reminder sent to RM as 7 days have passed since initial assignment",
    fromEmail: "system@scfleadmgmt.com",
    toEmail: "john.smith@example.com"
  },
  {
    id: "hist-4",
    date: "2025-03-27",
    time: "02:45 PM",
    type: "email_received",
    title: "RM Update",
    description: "Had a promising call with the dealer. Scheduling a follow-up meeting next week.",
    fromEmail: "john.smith@example.com",
    toEmail: "system@scfleadmgmt.com",
    aiDecision: "Positive progress. Reset escalation timeline.",
    attachments: [
      { name: "meeting_notes.pdf", size: "1.2 MB" }
    ]
  },
  {
    id: "hist-5",
    date: "2025-03-28",
    time: "09:00 AM",
    type: "status_change",
    title: "Flag Updated",
    description: "Flag changed from 'Escalation 1' to 'With RM' based on RM response",
  },
  {
    id: "hist-6",
    date: "2025-03-28",
    time: "09:01 AM",
    type: "system_action",
    title: "AI Assessment",
    description: "Based on RM's response and engagement, escalation process has been reset",
    aiDecision: "Response indicates active engagement. Reset escalation timeline."
  }
]

// Check if we're in a browser environment safely
const isBrowser = () => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.document !== 'undefined';
  } catch (e) {
    return false;
  }
};

export default function LeadDetails({ leadId }: LeadDetailsProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [communications, setCommunications] = useState<LeadCommunication[]>([])
  const [workflowState, setWorkflowState] = useState<LeadWorkflowState | null>(null)
  const [processedLeadData, setProcessedLeadData] = useState<ProcessedLead | null>(null)
  const [loadingComms, setLoadingComms] = useState(true)
  const [loadingWorkflowState, setLoadingWorkflowState] = useState(true)
  const [loadingProcessedLead, setLoadingProcessedLead] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Set mounted flag on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch workflow state for this lead
  useEffect(() => {
    // Skip fetching on server-side or if not mounted
    if (!isBrowser() || !mounted) return;

    async function fetchWorkflowState() {
      try {
        const state = await safeDbOperation(
          () => getLeadWorkflowStateByProcessedLeadId(leadId),
          undefined
        );
        setWorkflowState(state || null);
      } catch (err) {
        console.error("Error fetching workflow state:", err)
      } finally {
        setLoadingWorkflowState(false)
      }
    }
    
    fetchWorkflowState()
  }, [leadId, mounted])

  // Fetch communications for this lead
  useEffect(() => {
    // Skip fetching on server-side or if not mounted
    if (!isBrowser() || !mounted) return;

    async function fetchCommunications() {
      try {
        const comms = await safeDbOperation(
          () => getLeadCommunicationsByProcessedLeadId(leadId),
          []
        );
        
        // Sort by timestamp (newest first)
        const sortedComms = comms.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        
        setCommunications(sortedComms)
      } catch (err) {
        console.error("Error fetching communications:", err)
      } finally {
        setLoadingComms(false)
      }
    }
    
    fetchCommunications()
  }, [leadId, mounted])
  
  // Fetch processed lead data
  useEffect(() => {
    // Skip fetching on server-side or if not mounted
    if (!isBrowser() || !mounted) return;

    async function fetchProcessedLeadData() {
      try {
        const pLead = await safeDbOperation(
          () => db.processed_leads.get(leadId),
          null
        );
        setProcessedLeadData(pLead || null);
      } catch (err) {
        console.error("Error fetching processed lead data:", err)
      } finally {
        setLoadingProcessedLead(false)
      }
    }
    
    fetchProcessedLeadData()
  }, [leadId, mounted])

  // Skip rendering until mounted to prevent hydration mismatch
  if (!mounted && isBrowser()) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const toggleItem = (itemId: string) => {
    setExpandedItems(prevItems => 
      prevItems.includes(itemId) 
        ? prevItems.filter(id => id !== itemId)
        : [...prevItems, itemId]
    )
  }

  const isItemExpanded = (itemId: string) => expandedItems.includes(itemId)

  // Helper to get formatted dates
  const formatDateFromISOString = (isoString: string): string => {
    try {
      return format(new Date(isoString), "yyyy-MM-dd");
    } catch (e) {
      return "Invalid date";
    }
  }

  const formatTimeFromISOString = (isoString: string): string => {
    try {
      return format(new Date(isoString), "hh:mm a");
    } catch (e) {
      return "";
    }
  }

  // Helper to get icon based on communication type
  const getIconForCommunicationType = (type: string) => {
    switch (type) {
      case 'LeadAssignmentEmail':
      case 'SystemFollowUpEmail':
      case 'SystemReminderEmail':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'RMReply':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'PSMDecision_ReassignToRM':
      case 'PSMDecision_DropLead':
      case 'StageUpdate':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'AISystemAssessment':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'NoteAdded':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/rm-leads">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Lead Details: {processedLeadData?.smartfinLeadId || leadId}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="w-full">
          <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
            <div className="border-b border-gray-200 dark:border-[#1F1F23] flex px-4">
              <div className="flex-1">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white py-3">Lead History</h2>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 ml-auto">
                  <FileText className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {loadingComms ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading history...
                </div>
              ) : communications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No history records found.
                </div>
              ) : (
                communications.map((comm) => (
                  <div key={comm.id} className="border-b border-gray-200 dark:border-[#1F1F23] pb-4 last:border-0 last:pb-0">
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => toggleItem(comm.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">
                          {getIconForCommunicationType(comm.communicationType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {comm.title}
                            </p>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <p className="text-xs text-gray-500">
                                {formatDateFromISOString(comm.timestamp)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <p className="text-xs text-gray-500">
                                {formatTimeFromISOString(comm.timestamp)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                            {comm.description}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="mt-0.5">
                        {isItemExpanded(comm.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {isItemExpanded(comm.id) && (
                      <div className="mt-3 pl-8 space-y-3">
                        {(comm.senderAdidOrEmail || comm.recipientAdidOrEmail) && (
                          <div className="text-sm">
                            {comm.senderAdidOrEmail && (
                              <p className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium">From:</span> {comm.senderAdidOrEmail}
                              </p>
                            )}
                            {comm.recipientAdidOrEmail && (
                              <p className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium">To:</span> {comm.recipientAdidOrEmail}
                              </p>
                            )}
                            {comm.ccEmails && comm.ccEmails.length > 0 && (
                              <p className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium">CC:</span> {comm.ccEmails.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="bg-gray-50 dark:bg-[#1F1F23] p-3 rounded-md">
                          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                            {comm.description}
                          </p>
                        </div>
                        
                        {comm.aiDecision && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                                AI Decision
                              </p>
                            </div>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                              {comm.aiDecision}
                            </p>
                          </div>
                        )}
                        
                        {comm.attachments && comm.attachments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              Attachments
                            </p>
                            <div className="space-y-2">
                              {comm.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-50 dark:bg-[#1F1F23] p-2 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                      {attachment.name} <span className="text-gray-500">({attachment.size})</span>
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">Download</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rm-communications" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rm-communications">RM Communications</TabsTrigger>
          <TabsTrigger value="lead-notes">Lead Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rm-communications">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">RM Communications</h3>
            </div>
            
            {loadingComms ? (
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : communications.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  No RM Communications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  There are no communications for this lead yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div 
                    key={comm.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div 
                      className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-between items-center cursor-pointer"
                      onClick={() => toggleItem(comm.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          comm.communicationType === 'LeadAssignmentEmail' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {comm.communicationType === 'LeadAssignmentEmail' ? 'Assignment' : 'Reply'}
                        </span>
                        <span className="text-sm font-medium">
                          {comm.senderType === 'System' ? 'System' : 'RM'} 
                          {comm.senderType === 'System' ? ' → ' : ' → '}
                          {comm.recipientAdidOrEmail.includes('@') ? 'RM' : 'System'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comm.timestamp), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      {isItemExpanded(comm.id) ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {isItemExpanded(comm.id) && (
                      <div className="p-4 bg-white dark:bg-[#0F0F12]">
                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {comm.description}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <span className="font-medium">From:</span> {comm.senderAdidOrEmail}
                          <br />
                          <span className="font-medium">To:</span> {comm.recipientAdidOrEmail}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="lead-notes">
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Lead notes feature coming soon
          </div>
        </TabsContent>
      </Tabs>

      {/* Communication history card */}
      <Card>
        <CardHeader>
          <CardTitle>Communication History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {communications.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                No communications found for this lead.
              </div>
            ) : (
              communications.map((comm, index) => (
                <div
                  key={comm.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">
                        {comm.title || comm.communicationType || (comm as any).messageType || 'Communication'}
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comm.timestamp).toLocaleString()} • 
                        From: {comm.senderAdidOrEmail || (comm as any).sender || 'Unknown'} • 
                        To: {comm.recipientAdidOrEmail || (comm as any).recipient || 'Unknown'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleItem(comm.id)}
                    >
                      {expandedItems.includes(comm.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {expandedItems.includes(comm.id) && (
                    <>
                      <div className="p-3 bg-gray-50 dark:bg-[#1F1F23] rounded-md my-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {comm.description || (comm as any).content || ''}
                        </p>
                      </div>
                      
                      {/* Display AI-generated information if available */}
                      {(comm.aiSummary || comm.aiDecision) && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <div className="flex items-center mb-2">
                            <Sparkles className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              AI Analysis
                            </span>
                          </div>
                          
                          {comm.aiSummary && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Summary:
                              </span>
                              <span className="text-sm ml-2">
                                {comm.aiSummary}
                              </span>
                            </div>
                          )}
                          
                          {comm.aiDecision && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Suggested Next Action:
                              </span>
                              <span className="text-sm ml-2">
                                {comm.aiDecision}
                              </span>
                            </div>
                          )}
                          
                          {comm.aiTokensConsumed && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Tokens used: {comm.aiTokensConsumed}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Attachments section (if any) */}
                      {comm.attachments && comm.attachments.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-2">Attachments:</h5>
                          <div className="space-y-2">
                            {comm.attachments.map((attachment, i) => (
                              <div key={i} className="flex items-center p-2 border rounded-md bg-gray-50 dark:bg-[#1F1F23]">
                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-sm">{attachment.name}</span>
                                <span className="text-xs text-gray-500 ml-2">({attachment.size})</span>
                                {attachment.url && (
                                  <Button variant="ghost" size="sm" className="ml-auto h-6 px-2">
                                    <Download className="h-3 w-3 mr-1" />
                                    <span className="text-xs">Download</span>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 