"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import db from "@/lib/db"
import { stageToFlagMap } from "@/lib/lead-workflow"
import { createLeadCommunication } from "@/lib/lead-workflow"

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
}

interface EditLeadModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

// Define a mapping from flag to currentStage
const flagToStageMap: Record<string, string> = Object.fromEntries(
  Object.entries(stageToFlagMap).map(([stage, flag]) => [flag, stage])
);

export default function EditLeadModal({ lead, isOpen, onClose, onSave }: EditLeadModalProps) {
  const [flag, setFlag] = useState(lead.flag)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert selected flag back to a stage value
      const newStage = flagToStageMap[flag] || lead.currentStage;
      
      // If stage didn't change, don't update
      if (newStage === lead.currentStage && !notes) {
        onClose();
        return;
      }
      
      const now = new Date().toISOString();
      const updates: any = {
        updatedAt: now
      };
      
      // If stage changed, update stage-related fields
      if (newStage !== lead.currentStage) {
        updates.currentStage = newStage;
        updates.lastStageChangeTimestamp = now;
      }
      
      // Update the workflow state
      await db.lead_workflow_states.update(lead.workflowStateId, updates);
      
      // If notes were provided, add a communication record
      if (notes.trim()) {
        await createLeadCommunication({
          processedLeadId: lead.processedLeadId,
          communicationType: 'StageUpdate',
          title: 'Manual Stage Update',
          description: notes,
          senderType: 'RM',
          senderAdidOrEmail: lead.rmId || 'system',
          recipientAdidOrEmail: 'system',
          relatedWorkflowStateId: lead.workflowStateId
        });
      }
      
      // Call onSave callback if provided to refresh the leads list
      if (onSave) {
        onSave();
      }
      
      onClose();
    } catch (err) {
      console.error("Error updating lead:", err);
      setError("Failed to update lead. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
              <Input id="lastUpdated" value={lead.lastUpdated.split('T')[0] || lead.lastUpdated} readOnly className="bg-gray-50 dark:bg-[#1F1F23]" />
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
              <Select value={flag} onValueChange={setFlag}>
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
            <Textarea 
              id="notes" 
              placeholder="Add notes about this lead..." 
              className="min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-[#1F1F23]">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
