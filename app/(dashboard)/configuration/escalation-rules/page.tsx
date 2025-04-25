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
import { Plus, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface EscalationRule {
  id: string
  condition: string
  timeframe: number
  escalationType: "rm" | "cbl" | "rbl" | "psm" | "admin"
  escalationCC: string[]
  startStage: string
  endStage: string
  emailTemplate: string
}

export default function EscalationRules() {
  const [rules, setRules] = useState<EscalationRule[]>([
    {
      id: "1",
      condition: "No Response",
      timeframe: 24,
      escalationType: "rm",
      escalationCC: [],
      startStage: "",
      endStage: "",
      emailTemplate: ""
    },
  ])

  const addNewRule = () => {
    const newRule: EscalationRule = {
      id: Date.now().toString(),
      condition: "",
      timeframe: 24,
      escalationType: "rm",
      escalationCC: [],
      startStage: "",
      endStage: "",
      emailTemplate: ""
    }
    setRules([...rules, newRule])
  }

  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id))
  }

  const updateRule = (id: string, field: keyof EscalationRule, value: any) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ))
  }

  return (
    <main className="flex-1 ml-0 pt-16 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Escalation Rules</h1>
        <Button onClick={addNewRule} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle>Lead Escalation Configuration</CardTitle>
          <CardDescription>
            Configure rules for automatic lead escalation based on conditions and timeframes
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condition</TableHead>
                <TableHead>Start Stage</TableHead>
                <TableHead>End Stage</TableHead>
                <TableHead>Timeframe (in Hrs)</TableHead>
                <TableHead>Escalate To</TableHead>
                <TableHead>Escalation CC</TableHead>
                <TableHead>Email Template</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Select
                      value={rule.condition}
                      onValueChange={(value) => updateRule(rule.id, "condition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No Response">No Response</SelectItem>
                        <SelectItem value="Dealer Not Interested">Dealer Not Interested</SelectItem>
                        <SelectItem value="Under Follow-up">Under Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.startStage}
                      onValueChange={(value) => updateRule(rule.id, "startStage", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Start Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="With RM">With RM</SelectItem>
                        <SelectItem value="Escalation 1">Escalation 1</SelectItem>
                        <SelectItem value="Escalation 2">Escalation 2</SelectItem>
                        <SelectItem value="With PSM">With PSM</SelectItem>
                        <SelectItem value="Resent to RM">Resent to RM</SelectItem>
                        <SelectItem value="WIP in Smartfin">WIP in Smartfin</SelectItem>
                        <SelectItem value="Dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.endStage}
                      onValueChange={(value) => updateRule(rule.id, "endStage", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="End Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="With RM">With RM</SelectItem>
                        <SelectItem value="Escalation 1">Escalation 1</SelectItem>
                        <SelectItem value="Escalation 2">Escalation 2</SelectItem>
                        <SelectItem value="With PSM">With PSM</SelectItem>
                        <SelectItem value="Resent to RM">Resent to RM</SelectItem>
                        <SelectItem value="WIP in Smartfin">WIP in Smartfin</SelectItem>
                        <SelectItem value="Dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.timeframe}
                      onChange={(e) => updateRule(rule.id, "timeframe", parseInt(e.target.value))}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.escalationType}
                      onValueChange={(value: "rm" | "cbl" | "rbl" | "psm" | "admin") => updateRule(rule.id, "escalationType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rm">RM</SelectItem>
                        <SelectItem value="cbl">CBL</SelectItem>
                        <SelectItem value="rbl">RBL</SelectItem>
                        <SelectItem value="psm">PSM</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {["rm", "cbl", "rbl", "psm", "admin"].map((role) => (
                        <label key={role} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={rule.escalationCC.includes(role)}
                            onCheckedChange={(checked) => {
                              const newCC = checked
                                ? [...rule.escalationCC, role]
                                : rule.escalationCC.filter((r) => r !== role)
                              updateRule(rule.id, "escalationCC", newCC)
                            }}
                          />
                          {role.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.emailTemplate}
                      onValueChange={(value) => updateRule(rule.id, "emailTemplate", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reminder Email">Reminder Email</SelectItem>
                        <SelectItem value="Escalation Email">Escalation Email</SelectItem>
                        <SelectItem value="Escalation Email 2">Escalation Email 2</SelectItem>
                        <SelectItem value="No RM Response">No RM Response</SelectItem>
                        <SelectItem value="Lead Dropped">Lead Dropped</SelectItem>
                      </SelectContent>
                    </Select>
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