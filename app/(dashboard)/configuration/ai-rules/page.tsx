"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AIRule {
  id: string
  identifier: string
  flag: string
  aiSummary: string
  isActive: boolean
  emailTemplate: string
  triggerCondition: string
  confidenceThreshold: number
}

export default function AIRules() {
  const [rules, setRules] = useState<AIRule[]>([
    {
      id: "1",
      identifier: "Lead Summary",
      flag: "New Lead",
      aiSummary: "Generate a concise summary of the lead details including key business metrics and potential opportunities.",
      isActive: true,
      emailTemplate: "lead-summary",
      triggerCondition: "On Lead Creation",
      confidenceThreshold: 85,
    },
  ])

  const addNewRule = () => {
    const newRule: AIRule = {
      id: Date.now().toString(),
      identifier: "",
      flag: "",
      aiSummary: "",
      isActive: true,
      emailTemplate: "",
      triggerCondition: "",
      confidenceThreshold: 85,
    }
    setRules([...rules, newRule])
  }

  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id))
  }

  const updateRule = (id: string, field: keyof AIRule, value: any) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ))
  }

  return (
    <main className="flex-1 ml-0 pt-16 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Rules</h1>
        <Button onClick={addNewRule} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle>AI Configuration Rules</CardTitle>
          <CardDescription>
            Configure AI rules for automated email generation and content processing
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>AI Summary</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Input
                      value={rule.identifier}
                      onChange={(e) => updateRule(rule.id, "identifier", e.target.value)}
                      placeholder="Enter identifier"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.flag}
                      onValueChange={(value) => updateRule(rule.id, "flag", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select flag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New Lead">New Lead</SelectItem>
                        <SelectItem value="Follow Up">Follow Up</SelectItem>
                        <SelectItem value="Document Request">Document Request</SelectItem>
                        <SelectItem value="Approval">Approval</SelectItem>
                        <SelectItem value="Rejection">Rejection</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={rule.aiSummary}
                      onChange={(e) => updateRule(rule.id, "aiSummary", e.target.value)}
                      placeholder="Enter AI summary instructions"
                      className="min-h-[80px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.emailTemplate}
                      onValueChange={(value) => updateRule(rule.id, "emailTemplate", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead-summary">Lead Summary</SelectItem>
                        <SelectItem value="follow-up">Follow Up</SelectItem>
                        <SelectItem value="document-request">Document Request</SelectItem>
                        <SelectItem value="approval-notice">Approval Notice</SelectItem>
                        <SelectItem value="rejection-notice">Rejection Notice</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.triggerCondition}
                      onValueChange={(value) => updateRule(rule.id, "triggerCondition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On Lead Creation">On Lead Creation</SelectItem>
                        <SelectItem value="Status Change">Status Change</SelectItem>
                        <SelectItem value="Document Upload">Document Upload</SelectItem>
                        <SelectItem value="Manual Trigger">Manual Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.confidenceThreshold}
                      onChange={(e) => updateRule(rule.id, "confidenceThreshold", parseInt(e.target.value))}
                      min={0}
                      max={100}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => updateRule(rule.id, "isActive", checked)}
                      />
                      <Label>{rule.isActive ? "Active" : "Inactive"}</Label>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
} 