"use client"

import { useState } from "react"
import { 
  ArrowLeft, MessageSquare, Mail, AlertTriangle, 
  Calendar, Clock, Check, ChevronDown, ChevronUp, 
  FileText, Send, Download 
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

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

// Mock data - would come from API in real app
const LEAD_DATA: Lead = {
  id: "LD-001",
  dealerName: "ABC Motors",
  anchorName: "XYZ Corp",
  rmName: "John Smith",
  lastUpdated: "2025-03-28",
  priority: "High",
  ageingBucket: "0-7 days",
  lastActionDate: "2025-03-27",
  flag: "With RM",
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

export default function LeadDetails({ leadId }: LeadDetailsProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleItem = (itemId: string) => {
    setExpandedItems(prevItems => 
      prevItems.includes(itemId) 
        ? prevItems.filter(id => id !== itemId)
        : [...prevItems, itemId]
    )
  }

  const isItemExpanded = (itemId: string) => expandedItems.includes(itemId)

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
            Lead Details: {LEAD_DATA.id}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            Add Note
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          <Button size="sm" className="gap-1">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-[#1F1F23] border-b border-gray-200 dark:border-[#1F1F23]">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Lead Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lead ID</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">{LEAD_DATA.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dealer Name</p>
                <p className="text-base text-gray-900 dark:text-white">{LEAD_DATA.dealerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anchor Name</p>
                <p className="text-base text-gray-900 dark:text-white">{LEAD_DATA.anchorName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">RM Name</p>
                <p className="text-base text-gray-900 dark:text-white">{LEAD_DATA.rmName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</p>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      priorityColors[LEAD_DATA.priority]
                    )}
                  >
                    {LEAD_DATA.priority}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Flag</p>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      flagColors[LEAD_DATA.flag]
                    )}
                  >
                    {LEAD_DATA.flag}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ageing Bucket</p>
                <p className="text-base text-gray-900 dark:text-white">{LEAD_DATA.ageingBucket}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-base text-gray-900 dark:text-white">{LEAD_DATA.lastUpdated}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Action Date</p>
                <p className="text-base text-gray-900 dark:text-white">{LEAD_DATA.lastActionDate}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-[#1F1F23] border-b border-gray-200 dark:border-[#1F1F23]">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">AI Escalation Status</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {LEAD_DATA.flag === "With RM" && (
                  <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">With RM - Monitoring</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        4 days until 7-day reminder
                      </p>
                    </div>
                  </div>
                )}
                
                {LEAD_DATA.flag === "Escalation 1" && (
                  <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Escalation 1 Active</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        5 days until Escalation 2
                      </p>
                    </div>
                  </div>
                )}
                
                {LEAD_DATA.flag === "Escalation 2" && (
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Escalation 2 Active</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Critical attention required
                      </p>
                    </div>
                  </div>
                )}
                
                {LEAD_DATA.flag === "With PSM" && (
                  <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Transferred to PSM</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Escalated after no RM action
                      </p>
                    </div>
                  </div>
                )}
                
                {LEAD_DATA.flag === "Under Progress" && (
                  <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Under Progress</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Active work in progress
                      </p>
                    </div>
                  </div>
                )}
                
                {LEAD_DATA.flag === "Dropped" && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-full">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Dropped</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No further action required
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-[#1F1F23] pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Escalation Timeline</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs">1</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Lead Upload - 2025-03-20
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs">2</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        7-Day Reminder - 2025-03-27
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs">3</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Escalation 1 (Day 15) - 2025-04-04
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-xs">4</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Escalation 2 (Day 20) - 2025-04-09
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="history">
            <TabsList className="mb-4">
              <TabsTrigger value="history">History & Interactions</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="space-y-4">
              <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#1F1F23] border-b border-gray-200 dark:border-[#1F1F23] flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Lead History</h2>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                  {LEAD_HISTORY.map((item) => (
                    <div key={item.id} className="p-4">
                      <div 
                        className="flex justify-between items-start cursor-pointer"
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className="flex gap-3">
                          {item.type === "email_sent" && (
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                              <Send className="h-4 w-4" />
                            </div>
                          )}
                          
                          {item.type === "email_received" && (
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                              <Mail className="h-4 w-4" />
                            </div>
                          )}
                          
                          {item.type === "status_change" && (
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}
                          
                          {item.type === "note" && (
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                          )}
                          
                          {item.type === "system_action" && (
                            <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-full text-gray-600 dark:text-gray-400">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                            <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {item.date}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.time}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button className="text-gray-500">
                          {isItemExpanded(item.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      {isItemExpanded(item.id) && (
                        <div className="mt-3 ml-10 pl-3 border-l-2 border-gray-200 dark:border-[#1F1F23]">
                          <div className="space-y-2">
                            {(item.type === "email_sent" || item.type === "email_received") && (
                              <div className="text-sm">
                                <p className="text-gray-500 dark:text-gray-400">
                                  {item.type === "email_sent" ? "From:" : "From:"} <span className="text-gray-900 dark:text-white">{item.fromEmail}</span>
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {item.type === "email_sent" ? "To:" : "To:"} <span className="text-gray-900 dark:text-white">{item.toEmail}</span>
                                </p>
                              </div>
                            )}
                            
                            <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                            
                            {item.aiDecision && (
                              <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800/30">
                                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">AI Analysis</p>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">{item.aiDecision}</p>
                              </div>
                            )}
                            
                            {item.attachments && item.attachments.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Attachments</p>
                                <div className="space-y-1">
                                  {item.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <FileText className="h-3 w-3 text-gray-400" />
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{attachment.name} ({attachment.size})</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents">
              <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-4 text-center">
                <p className="text-gray-500 dark:text-gray-400">Documents will be displayed here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="notes">
              <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] p-4 text-center">
                <p className="text-gray-500 dark:text-gray-400">Notes will be displayed here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 