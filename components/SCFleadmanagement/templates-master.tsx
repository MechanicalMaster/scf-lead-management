"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Mail, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  isActive: boolean
}

export default function TemplatesMaster() {
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({
    leadUpload: {
      id: "leadUpload",
      name: "Lead Upload Notification",
      subject: "New lead has been uploaded",
      body: "Dear {{recipient}},\n\nA new lead has been uploaded to the system.\n\nLead ID: {{leadId}}\nDealer ID: {{dealerId}}\nAnchor ID: {{anchorId}}\n\nPlease log in to the system to view more details.\n\nRegards,\nLead Management Team",
      isActive: true,
    },
    reminder: {
      id: "reminder",
      name: "Lead Follow-up Reminder",
      subject: "Reminder: Follow up on lead {{leadId}}",
      body: "Dear {{recipient}},\n\nThis is a friendly reminder to follow up on lead {{leadId}} for dealer {{dealerId}}.\n\nThe lead was assigned to you on {{assignDate}} and requires your attention.\n\nRegards,\nLead Management Team",
      isActive: true,
    },
    escalation: {
      id: "escalation",
      name: "Lead Escalation Notification",
      subject: "ESCALATION: Lead {{leadId}} requires attention",
      body: "Dear {{recipient}},\n\nA lead has been escalated and requires your immediate attention.\n\nLead ID: {{leadId}}\nDealer ID: {{dealerId}}\nAnchor ID: {{anchorId}}\nReason for escalation: {{reason}}\n\nPlease log in to the system to handle this lead as soon as possible.\n\nRegards,\nLead Management Team",
      isActive: true,
    },
    summary: {
      id: "summary",
      name: "Daily Lead Summary",
      subject: "Daily Lead Summary - {{date}}",
      body: "Dear {{recipient}},\n\nHere is your daily lead summary for {{date}}:\n\nNew Leads: {{newLeadCount}}\nContacted: {{contactedCount}}\nQualified: {{qualifiedCount}}\nProposal: {{proposalCount}}\nNegotiation: {{negotiationCount}}\nClosed Won: {{closedWonCount}}\nClosed Lost: {{closedLostCount}}\n\nPlease log in to the system for more detailed information.\n\nRegards,\nLead Management Team",
      isActive: true,
    },
  })

  const [selectedTemplate, setSelectedTemplate] = useState<string>("leadUpload")
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    setSaveSuccess(null)
  }

  const handleSubjectChange = (value: string) => {
    setTemplates({
      ...templates,
      [selectedTemplate]: {
        ...templates[selectedTemplate],
        subject: value,
      },
    })
  }

  const handleBodyChange = (value: string) => {
    setTemplates({
      ...templates,
      [selectedTemplate]: {
        ...templates[selectedTemplate],
        body: value,
      },
    })
  }

  const toggleActive = () => {
    setTemplates({
      ...templates,
      [selectedTemplate]: {
        ...templates[selectedTemplate],
        isActive: !templates[selectedTemplate].isActive,
      },
    })
  }

  const handleSave = () => {
    setIsSaving(true)
    setSaveSuccess(null)

    // Simulate API call to save templates
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
    }, 1000)
  }

  const renderAvailableVariables = () => {
    const commonVariables = ["recipient"];
    const templateSpecificVariables: Record<string, string[]> = {
      leadUpload: ["leadId", "dealerId", "anchorId"],
      reminder: ["leadId", "dealerId", "assignDate"],
      escalation: ["leadId", "dealerId", "anchorId", "reason"],
      summary: [
        "date",
        "newLeadCount",
        "contactedCount",
        "qualifiedCount",
        "proposalCount",
        "negotiationCount",
        "closedWonCount",
        "closedLostCount",
      ],
    };

    const variables = [...commonVariables, ...(templateSpecificVariables[selectedTemplate] || [])];

    return (
      <div className="p-3 bg-gray-50 dark:bg-[#1F1F23] rounded-md mt-2">
        <p className="text-sm font-medium mb-2">Available Variables:</p>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <div
              key={variable}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-[#2D2D34] rounded-md text-gray-700 dark:text-gray-300"
            >
              {`{{${variable}}}`}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates Master</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Configure email templates that will be sent by the application. Use variables enclosed in double curly braces
            to include dynamic content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="leadUpload"
            value={selectedTemplate}
            onValueChange={handleTemplateChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="leadUpload">Lead Upload</TabsTrigger>
              <TabsTrigger value="reminder">Reminder</TabsTrigger>
              <TabsTrigger value="escalation">Escalation</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            {Object.values(templates).map((template) => (
              <TabsContent key={template.id} value={template.id}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure the email template for {template.name.toLowerCase()}.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${template.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${template.id}`}
                        checked={template.isActive}
                        onCheckedChange={toggleActive}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`subject-${template.id}`}>Subject</Label>
                    <div className="flex gap-2">
                      <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-2" />
                      <Input
                        id={`subject-${template.id}`}
                        placeholder="Email subject"
                        value={template.subject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`body-${template.id}`}>Email Body</Label>
                    <Textarea
                      id={`body-${template.id}`}
                      placeholder="Enter email body"
                      value={template.body}
                      onChange={(e) => handleBodyChange(e.target.value)}
                      className="min-h-[300px] font-mono"
                    />
                  </div>

                  {renderAvailableVariables()}

                  {template.id === selectedTemplate && saveSuccess && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30">
                      <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">Template Saved</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        The email template has been saved successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-1">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 