"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import db, { LeadCommunication } from "@/lib/db"
import { v4 as uuidv4 } from 'uuid'
import { MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { getRMInboxEmails } from "@/lib/lead-utils"
import { createRMReplyCommunication } from "@/lib/lead-workflow"
import { getAiAnalysisForReply } from "@/lib/ai-service"
import { safeDbOperation } from "@/lib/db-init"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, AlertCircle } from "lucide-react"

// Check if we're in a browser environment safely
const isBrowser = () => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.document !== 'undefined';
  } catch (e) {
    return false;
  }
};

export default function RMInbox() {
  const { userEmail, user } = useAuth()
  const [communications, setCommunications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({})
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)
  const [aiConfigStatus, setAiConfigStatus] = useState<'unconfigured' | 'invalid' | 'configured' | 'unknown'>('unknown')

  // Set mounted flag on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch communications for the logged-in RM
  useEffect(() => {
    // Skip fetching on server-side or if not mounted
    if (!isBrowser() || !mounted) return;
    
    async function fetchCommunications() {
      if (!userEmail) return;

      try {
        console.log("[RM Inbox Component] Fetching emails for user:", { 
          email: userEmail, 
          id: user?.id || 'Not Available'
        });
        
        // Get the RM ADID - prefer user ID from auth context if available
        // For test accounts, RM1 = "REM0000001"
        const rmAdid = user?.id || "RM1";
        console.log(`[RM Inbox Component] Using RM ADID: ${rmAdid}`);
        
        // Use the utility function to get inbox emails safely
        const inboxEmails = await safeDbOperation(
          () => getRMInboxEmails(rmAdid),
          [] // Empty array as fallback
        );
        
        console.log(`[RM Inbox Component] Retrieved ${inboxEmails.length} emails`);
        
        setCommunications(inboxEmails);
      } catch (err: any) {
        console.error("[RM Inbox Component] Error fetching communications:", err);
        setError("Failed to load your inbox. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunications();
  }, [userEmail, user, mounted]);

  // Add effect to check AI configuration
  useEffect(() => {
    // Skip on server-side or if not mounted
    if (!isBrowser() || !mounted) return;
    
    // Check if OpenAI API key is configured in environment variables
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      setAiConfigStatus('unconfigured');
    } else {
      setAiConfigStatus('configured');
    }
  }, [mounted]);

  // Skip rendering until mounted to prevent hydration mismatch
  if (!mounted && isBrowser()) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Toggle message expansion
  const toggleMessageExpand = (id: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Handle reply text change
  const handleReplyChange = (id: string, text: string) => {
    setReplyTexts(prev => ({
      ...prev,
      [id]: text
    }))
  }

  // Submit reply
  const submitReply = async (comm: any) => {
    if (!userEmail || !replyTexts[comm.id]) return;
    
    try {
      console.log("[RM Inbox Component] Submitting reply to:", comm);
      setIsSubmitting(comm.id, true);
      
      // Get the processed lead ID (from old or new schema)
      const processedLeadId = comm.processedLeadId || comm.leadId;
      
      if (!processedLeadId) {
        throw new Error("Cannot find lead ID for this communication");
      }
      
      console.log(`[RM Inbox Component] Creating reply for lead: ${processedLeadId}`);
      
      // Get AI analysis for the reply text
      let aiSummary, aiDecision, aiTokensConsumed;
      try {
        const aiAnalysis = await getAiAnalysisForReply(replyTexts[comm.id]);
        if (aiAnalysis) {
          aiSummary = aiAnalysis.summary;
          aiDecision = aiAnalysis.nextActionPrediction;
          aiTokensConsumed = aiAnalysis.tokensConsumed;
          console.log("[RM Inbox Component] AI Analysis:", {
            summary: aiSummary,
            decision: aiDecision,
            tokens: aiTokensConsumed
          });
        }
      } catch (aiError) {
        console.error("[RM Inbox Component] Error getting AI analysis:", aiError);
        // Continue without AI analysis if it fails
      }
      
      // Use the lead workflow function to create a reply
      const reply = await createRMReplyCommunication(
        processedLeadId,
        userEmail,
        replyTexts[comm.id],
        aiSummary,
        aiDecision,
        aiTokensConsumed
      );
      
      console.log("[RM Inbox Component] Reply created successfully:", reply);
      
      // Update local state
      setCommunications(prev => [reply, ...prev]);
      
      // Clear reply text
      setReplyTexts(prev => ({
        ...prev,
        [comm.id]: ''
      }));
      
      // Close the expanded view
      setExpandedMessages(prev => ({
        ...prev,
        [comm.id]: false
      }));
    } catch (err: any) {
      console.error("[RM Inbox Component] Error submitting reply:", err);
      setError("Failed to send your reply. Please try again.");
    } finally {
      setIsSubmitting(comm.id, false);
    }
  }

  // Helper to get lead ID consistently from old or new schema
  const getLeadId = (comm: any) => comm.processedLeadId || comm.leadId

  // Group communications by leadId
  const groupedCommunications = communications.reduce((groups: Record<string, any[]>, comm: any) => {
    // Get the processed lead ID (from old or new schema)
    const leadId = comm.processedLeadId || comm.leadId;
    
    if (!leadId) {
      console.warn("[RM Inbox Component] Communication without lead ID:", comm.id);
      return groups;
    }
    
    if (!groups[leadId]) {
      groups[leadId] = [];
    }
    groups[leadId].push(comm);
    return groups;
  }, {} as Record<string, any[]>);

  // Helper to determine if a message is an assignment (supports both schemas)
  const isAssignment = (comm: any) => 
    comm.messageType === 'assignment' || 
    comm.communicationType === 'LeadAssignmentEmail'

  // Helper to get message content
  const getMessageContent = (comm: any) => 
    comm.content || comm.description || ''

  // Helper to set submission status
  const setIsSubmitting = (id: string, isSubmitting: boolean) => {
    setSubmittingIds(prev => ({
      ...prev,
      [id]: isSubmitting
    }));
  };

  // Helper to check if a reply is submitting
  const isSubmitting = (id: string) => submittingIds[id] || false;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RM Inbox</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and respond to lead assignments and communications
        </p>
      </div>

      {aiConfigStatus === 'unconfigured' && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>AI Configuration Required</AlertTitle>
          <AlertDescription>
            AI analysis features require an OpenAI API key. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file.
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(groupedCommunications).length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-md text-center">
          <MessageSquare className="h-10 w-10 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No communications yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            New lead assignments and communications will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedCommunications).map(([leadId, comms]) => {
            // Find the lead assignment message
            const assignmentMsg = comms.find(c => isAssignment(c))
            if (!assignmentMsg) return null

            return (
              <Card key={leadId} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base">Lead ID: {leadId}</CardTitle>
                      <CardDescription>
                        Assigned: {format(new Date(assignmentMsg.timestamp), 'MMM d, yyyy h:mm a')}
                      </CardDescription>
                    </div>
                    <Link 
                      href={`/lead-details/${leadId}`} 
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Lead Details
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {comms.map((comm) => (
                    <div key={comm.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => toggleMessageExpand(comm.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              isAssignment(comm)
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            }`}>
                              {isAssignment(comm) ? 'Assignment' : 'Reply'}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {(comm.sender === 'system' || comm.senderType === 'System') ? 'System' : 'You'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(comm.timestamp), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          {expandedMessages[comm.id] ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        
                        {!expandedMessages[comm.id] && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {getMessageContent(comm).substring(0, 100)}
                            {getMessageContent(comm).length > 100 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      
                      {expandedMessages[comm.id] && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800">
                          <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {getMessageContent(comm)}
                          </div>
                          
                          {/* Reply section - only show for assignment messages */}
                          {isAssignment(comm) && (
                            <div className="mt-4 space-y-3">
                              <Textarea
                                placeholder="Type your reply here..."
                                value={replyTexts[comm.id] || ''}
                                onChange={(e) => handleReplyChange(comm.id, e.target.value)}
                                className="min-h-[100px]"
                              />
                              <Button 
                                onClick={() => submitReply(comm)} 
                                disabled={!replyTexts[comm.id]?.trim() || isSubmitting(comm.id)}
                                className="flex-shrink-0"
                              >
                                {isSubmitting(comm.id) ? (
                                  <span className="flex items-center">
                                    <span className="h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                                    Processing...
                                  </span>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Reply
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 