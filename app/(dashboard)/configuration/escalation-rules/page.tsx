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

interface EscalationRule {
  id: string
  anchor: string
  condition: string
  timeframe: number
  timeUnit: "hours" | "days"
  escalationType: "rm" | "psm" | "admin"
}

export default function EscalationRules() {
  const [rules, setRules] = useState<EscalationRule[]>([
    {
      id: "1",
      anchor: "Anchor 1",
      condition: "No Response",
      timeframe: 24,
      timeUnit: "hours",
      escalationType: "rm",
    },
  ])

  const addNewRule = () => {
    const newRule: EscalationRule = {
      id: Date.now().toString(),
      anchor: "",
      condition: "",
      timeframe: 24,
      timeUnit: "hours",
      escalationType: "rm",
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
                <TableHead>Anchor</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Timeframe</TableHead>
                <TableHead>Escalate To</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Select
                      value={rule.anchor}
                      onValueChange={(value) => updateRule(rule.id, "anchor", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select anchor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Anchor 1">Anchor 1</SelectItem>
                        <SelectItem value="Anchor 2">Anchor 2</SelectItem>
                        <SelectItem value="Anchor 3">Anchor 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
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
                        <SelectItem value="Pending Documents">Pending Documents</SelectItem>
                        <SelectItem value="Incomplete Information">Incomplete Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={rule.timeframe}
                        onChange={(e) => updateRule(rule.id, "timeframe", parseInt(e.target.value))}
                        className="w-20"
                      />
                      <Select
                        value={rule.timeUnit}
                        onValueChange={(value: "hours" | "days") => updateRule(rule.id, "timeUnit", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rule.escalationType}
                      onValueChange={(value: "rm" | "psm" | "admin") => updateRule(rule.id, "escalationType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rm">RM Manager</SelectItem>
                        <SelectItem value="psm">PSM</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
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