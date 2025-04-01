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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">With RM - Monitoring</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">4 days until 7-day reminder</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Escalation Timeline</p>
                  <div className="bg-gray-100 dark:bg-[#1F1F23] rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 font-medium">1</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Lead Upload - 2025-03-20</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 font-medium">2</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">7-Day Reminder - 2025-03-27</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 font-medium">3</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Escalation 1 (Day 15) - 2025-04-04</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 font-medium">4</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Escalation 2 (Day 20) - 2025-04-09</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
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
              {LEAD_HISTORY.map((historyItem) => (
                <div 
                  key={historyItem.id} 
                  className="border border-gray-200 dark:border-[#1F1F23] rounded-lg overflow-hidden"
                >
                  <div 
                    className={cn(
                      "px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-[#1F1F23] cursor-pointer",
                      isItemExpanded(historyItem.id) && "border-b border-gray-200 dark:border-[#1F1F23]"
                    )}
                    onClick={() => toggleItem(historyItem.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{historyItem.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{historyItem.time}</span>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {historyItem.title}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isItemExpanded(historyItem.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isItemExpanded(historyItem.id) && (
                    <div className="p-4 bg-white dark:bg-[#0F0F12]">
                      <div className="space-y-3">
                        <p className="text-gray-700 dark:text-gray-300">{historyItem.description}</p>
                        
                        {(historyItem.fromEmail || historyItem.toEmail) && (
                          <div className="bg-gray-50 dark:bg-[#1F1F23] rounded-md p-3 space-y-2">
                            {historyItem.fromEmail && (
                              <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">From:</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{historyItem.fromEmail}</span>
                              </div>
                            )}
                            {historyItem.toEmail && (
                              <div className="flex items-start gap-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">To:</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{historyItem.toEmail}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {historyItem.aiDecision && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                            <div className="flex gap-2">
                              <div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI Analysis</span>
                                <p className="text-sm text-blue-600 dark:text-blue-300">{historyItem.aiDecision}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {historyItem.attachments && historyItem.attachments.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</p>
                            <div className="space-y-2">
                              {historyItem.attachments.map((attachment, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center justify-between bg-gray-50 dark:bg-[#1F1F23] p-2 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{attachment.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({attachment.size})</span>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 