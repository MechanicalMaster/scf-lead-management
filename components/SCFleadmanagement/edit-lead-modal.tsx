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
    console.log("Saving lead with updated flag:", flag)
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
          </div>

          <div className="mb-6">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Add notes about this lead..." className="min-h-[100px]" />
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
