"use client"

import { useState } from "react"
import {
  BarChart,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  FileText,
  BarChart2,
  PieChartIcon,
  LineChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days")

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>

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

      <Tabs defaultValue="lead-status">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 mb-4">
          <TabsTrigger value="lead-status" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Lead Status
          </TabsTrigger>
          <TabsTrigger value="lead-summary" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Lead Summary
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Key Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lead-status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <CardDescription>All leads in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-green-500 flex items-center mt-1">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                <CardDescription>Leads in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">186</div>
                <p className="text-xs text-green-500 flex items-center mt-1">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <CardDescription>Leads to customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.7%</div>
                <p className="text-xs text-red-500 flex items-center mt-1">-2% from last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lead Status Distribution</CardTitle>
              <CardDescription>Number of leads by status</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <BarChart2 className="h-16 w-16 opacity-50" />
                <div className="ml-4 text-center">
                  <p className="text-lg font-medium">Chart Visualization</p>
                  <p className="text-sm">Bar chart showing lead distribution by status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lead-summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources</CardTitle>
                <CardDescription>Where leads are coming from</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <PieChartIcon className="h-16 w-16 opacity-50" />
                  <div className="ml-4 text-center">
                    <p className="text-lg font-medium">Chart Visualization</p>
                    <p className="text-sm">Pie chart showing lead sources</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lead by RM</CardTitle>
                <CardDescription>Lead distribution by relationship manager</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <BarChart2 className="h-16 w-16 opacity-50" />
                  <div className="ml-4 text-center">
                    <p className="text-lg font-medium">Chart Visualization</p>
                    <p className="text-sm">Bar chart showing leads by RM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lead Summary Report</CardTitle>
                <CardDescription>Detailed breakdown of all leads</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="h-4 w-4" />
                Download Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-[#1F1F23] dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Count
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Percentage
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white dark:bg-[#0F0F12] border-b dark:border-[#1F1F23]">
                      <td className="px-6 py-4">New</td>
                      <td className="px-6 py-4">42</td>
                      <td className="px-6 py-4">17%</td>
                      <td className="px-6 py-4 text-green-500">+8%</td>
                    </tr>
                    <tr className="bg-white dark:bg-[#0F0F12] border-b dark:border-[#1F1F23]">
                      <td className="px-6 py-4">Contacted</td>
                      <td className="px-6 py-4">68</td>
                      <td className="px-6 py-4">28%</td>
                      <td className="px-6 py-4 text-green-500">+12%</td>
                    </tr>
                    <tr className="bg-white dark:bg-[#0F0F12] border-b dark:border-[#1F1F23]">
                      <td className="px-6 py-4">Qualified</td>
                      <td className="px-6 py-4">53</td>
                      <td className="px-6 py-4">21%</td>
                      <td className="px-6 py-4 text-red-500">-3%</td>
                    </tr>
                    <tr className="bg-white dark:bg-[#0F0F12] border-b dark:border-[#1F1F23]">
                      <td className="px-6 py-4">Proposal</td>
                      <td className="px-6 py-4">35</td>
                      <td className="px-6 py-4">14%</td>
                      <td className="px-6 py-4 text-green-500">+5%</td>
                    </tr>
                    <tr className="bg-white dark:bg-[#0F0F12]">
                      <td className="px-6 py-4">Closed Won</td>
                      <td className="px-6 py-4">49</td>
                      <td className="px-6 py-4">20%</td>
                      <td className="px-6 py-4 text-green-500">+2%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
                <CardDescription>Time to first contact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2 hours</div>
                <p className="text-xs text-green-500 flex items-center mt-1">Improved by 15% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lead Qualification Rate</CardTitle>
                <CardDescription>New to qualified conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-green-500 flex items-center mt-1">+3% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
                <CardDescription>For closed won leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$24,500</div>
                <p className="text-xs text-green-500 flex items-center mt-1">+8% from last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lead Performance Over Time</CardTitle>
              <CardDescription>Monthly trends for key metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <LineChart className="h-16 w-16 opacity-50" />
                <div className="ml-4 text-center">
                  <p className="text-lg font-medium">Chart Visualization</p>
                  <p className="text-sm">Line chart showing lead metrics over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

