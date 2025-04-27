"use client"

import { useState } from "react"
import {
  Calendar,
  Download,
  Filter,
  ChevronDown,
  FileSpreadsheet,
  FilePieChart,
  FileBarChart,
  Check,
  AlarmClock,
  BarChart,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/components/auth-provider"

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  format: string[]
  lastUpdated: string
  roles: Array<"admin" | "rm">
}

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days")
  const [selectedFormat, setSelectedFormat] = useState<Record<string, string>>({})
  const { userRole } = useAuth()

  // Available report types
  const reportTypes: ReportType[] = [
    {
      id: "lead-status",
      name: "Lead Status Report",
      description: "Comprehensive report on all leads and their current status",
      icon: <FileBarChart className="h-5 w-5" />,
      format: ["xlsx"],
      lastUpdated: "Today at 09:30 AM",
      roles: ["admin", "rm"],
    },
    {
      id: "application-status",
      name: "Application Status Report",
      description: "Detailed report on application processing status and timelines",
      icon: <FilePieChart className="h-5 w-5" />,
      format: ["xlsx"],
      lastUpdated: "Today at 09:30 AM",
      roles: ["admin", "rm"],
    },
    {
      id: "rejected-leads",
      name: "Rejected Leads Report",
      description: "Analysis of rejected leads with rejection reasons",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      format: ["xlsx"],
      lastUpdated: "Today at 09:30 AM",
      roles: ["admin", "rm"],
    },
    {
      id: "lead-aging",
      name: "Lead Aging Report",
      description: "Report on lead age and time spent in each status",
      icon: <AlarmClock className="h-5 w-5" />,
      format: ["xlsx"],
      lastUpdated: "Today at 09:30 AM",
      roles: ["admin", "rm"],
    },
    {
      id: "rm-performance",
      name: "RM Performance Report",
      description: "Performance metrics for relationship managers",
      icon: <BarChart className="h-5 w-5" />,
      format: ["xlsx"],
      lastUpdated: "Today at 09:30 AM",
      roles: ["admin"],
    },
    {
      id: "my-leads-report",
      name: "My Leads Report",
      description: "Detailed report of all your assigned leads",
      icon: <FileText className="h-5 w-5" />,
      format: ["xlsx"],
      lastUpdated: "Today at 09:30 AM",
      roles: ["rm"],
    }
  ]

  // Filter reports based on user role
  const filteredReports = reportTypes.filter(report => 
    report.roles.includes(userRole as "admin" | "rm")
  );

  const handleDownload = (reportId: string, format: string) => {
    // In a real application, this would trigger an API call to generate and download the report
    console.log(`Downloading ${reportId} in ${format} format`)
    alert(`Downloading ${reportId} in ${format} format. This would be an API call in a real application.`)
    
    // Update the selected format for this report
    setSelectedFormat({
      ...selectedFormat,
      [reportId]: format
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {userRole === "rm" ? "My Reports" : "Reports"}
        </h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="this-month">This month</SelectItem>
              <SelectItem value="last-month">Last month</SelectItem>
              <SelectItem value="this-year">This year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Download reports in various formats</p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Download Format</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {report.icon}
                      {report.name}
                    </div>
                  </TableCell>
                  <TableCell>{report.description}</TableCell>
                  <TableCell>{report.lastUpdated}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {report.format.map((format) => (
                        <Button
                          key={format}
                          variant={selectedFormat[report.id] === format ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDownload(report.id, format)}
                          className="w-16"
                        >
                          {format.toUpperCase()}
                          {selectedFormat[report.id] === format && (
                            <Check className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#1F1F23] border-t border-gray-200 dark:border-[#1F1F23]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Reports are generated based on the selected date range: <span className="font-medium">{dateRange.replace(/-/g, " ")}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
