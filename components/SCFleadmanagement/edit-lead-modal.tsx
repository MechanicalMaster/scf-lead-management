"use client"

import { useState } from "react"
import { X, Upload, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface Attachment {
  id: string
  name: string
  size: string
  type: string
  uploadDate: string
}

interface EditLeadModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
}

export default function EditLeadModal({ lead, isOpen, onClose }: EditLeadModalProps) {
  const [priority, setPriority] = useState(lead.priority)
  const [flag, setFlag] = useState(lead.flag)
  const [attachments, setAttachments] = useState<Attachment[]>([
    {
      id: "1",
      name: "lead_proposal.pdf",
      size: "2.4 MB",
      type: "PDF",
      uploadDate: "2025-03-25",
    },
    {
      id: "2",
      name: "customer_requirements.docx",
      size: "1.8 MB",
      type: "DOCX",
      uploadDate: "2025-03-24",
    },
  ])

  const handleSave = () => {
    // Here you would typically save the changes to your backend
    console.log("Saving lead with updated flag:", flag, "and priority:", priority)
    onClose()
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Lead {lead.id}</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="dealerName">Dealer Name</Label>
              <Input id="dealerName" value={lead.dealerName} readOnly className="bg-gray-50 dark:bg-[#1F1F23]" />
            </div>
            <div>
              <Label htmlFor="anchorName">Anchor Name</Label>
              <Input id="anchorName" value={lead.anchorName} readOnly className="bg-gray-50 dark:bg-[#1F1F23]" />
            </div>
            <div>
              <Label htmlFor="rmName">RM Name</Label>
              <Input id="rmName" value={lead.rmName} readOnly className="bg-gray-50 dark:bg-[#1F1F23]" />
            </div>
            <div>
              <Label htmlFor="lastUpdated">Last Updated</Label>
              <Input id="lastUpdated" value={lead.lastUpdated} readOnly className="bg-gray-50 dark:bg-[#1F1F23]" />
            </div>
            <div>
              <Label htmlFor="ageingBucket">Ageing Bucket</Label>
              <Input id="ageingBucket" value={lead.ageingBucket} readOnly className="bg-gray-50 dark:bg-[#1F1F23]" />
            </div>
            <div>
              <Label htmlFor="lastActionDate">Last Action Date</Label>
              <Input id="lastActionDate" value={lead.lastActionDate} readOnly className="bg-gray-50 dark:bg-[#1F1F23]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="flag">Flag</Label>
              <Select value={flag} onValueChange={(value: typeof flag) => setFlag(value)}>
                <SelectTrigger id="flag">
                  <SelectValue placeholder="Select flag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="With RM">With RM</SelectItem>
                  <SelectItem value="Escalation 1">Escalation 1</SelectItem>
                  <SelectItem value="Escalation 2">Escalation 2</SelectItem>
                  <SelectItem value="With PSM">With PSM</SelectItem>
                  <SelectItem value="Under Progress">Under Progress</SelectItem>
                  <SelectItem value="Dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: typeof priority) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Add notes about this lead..." className="min-h-[100px]" />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Label>Attachments</Label>
              <Button variant="outline" size="sm" className="gap-1">
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
            </div>

            <div className="border border-gray-200 dark:border-[#1F1F23] rounded-lg overflow-hidden">
              {attachments.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-[#1F1F23] rounded">
                          <div className="text-xs font-medium text-gray-900 dark:text-white">{attachment.type}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{attachment.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {attachment.size} • Uploaded on {attachment.uploadDate}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1F1F23]">
                    <Plus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No attachments</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload files related to this lead</p>
                  <div className="mt-6">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Upload className="h-4 w-4" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-[#1F1F23]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

