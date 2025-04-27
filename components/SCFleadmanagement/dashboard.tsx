"use client"

import { useState } from "react"
import { 
  ChevronUp, 
  ChevronDown, 
  Users, 
  UserPlus, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Filter
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Mock data
const leadSummaryData = [
  {
    title: "Total Leads",
    value: 245,
    change: +12.5,
    icon: Users,
    iconColorClass: "text-blue-500 bg-blue-100 dark:bg-blue-900/20",
  },
  {
    title: "New Leads (This Week)",
    value: 38,
    change: +25.2,
    icon: UserPlus,
    iconColorClass: "text-green-500 bg-green-100 dark:bg-green-900/20",
  },
  {
    title: "Pending Action",
    value: 42,
    change: -5.3,
    icon: Clock,
    iconColorClass: "text-amber-500 bg-amber-100 dark:bg-amber-900/20",
  },
  {
    title: "Overdue",
    value: 17,
    change: +10.2,
    icon: AlertCircle,
    iconColorClass: "text-red-500 bg-red-100 dark:bg-red-900/20",
  },
]

const leadStatusData = [
  { name: "New", value: 65, color: "#3b82f6" },
  { name: "Contacted", value: 45, color: "#8b5cf6" },
  { name: "Qualified", value: 40, color: "#f59e0b" },
  { name: "Proposal", value: 35, color: "#6366f1" },
  { name: "Negotiation", value: 30, color: "#f97316" },
  { name: "Closed Won", value: 20, color: "#10b981" },
  { name: "Closed Lost", value: 10, color: "#ef4444" },
]

const leadAgingData = [
  { name: "0-7 days", new: 25, contacted: 15, qualified: 10, proposal: 8 },
  { name: "8-14 days", new: 18, contacted: 12, qualified: 8, proposal: 10 },
  { name: "15-30 days", new: 12, contacted: 10, qualified: 12, proposal: 8 },
  { name: "31-60 days", new: 8, contacted: 6, qualified: 5, proposal: 6 },
  { name: "60+ days", new: 2, contacted: 2, qualified: 5, proposal: 3 },
]

const recentLeads = [
  {
    id: "LD-001",
    dealerId: "DLR-5678",
    anchorId: "ANC-1234",
    rmName: "John Smith",
    psmName: "Alex Williams",
    status: "New",
    lastUpdated: "Mar 28, 2025",
    daysOld: 2,
  },
  {
    id: "LD-002",
    dealerId: "DLR-9012",
    anchorId: "ANC-5678",
    rmName: "Sarah Johnson",
    psmName: "Mike Thompson",
    status: "Contacted",
    lastUpdated: "Mar 27, 2025",
    daysOld: 3,
  },
  {
    id: "LD-003",
    dealerId: "DLR-3456",
    anchorId: "ANC-9012",
    rmName: "Michael Brown",
    psmName: "Lisa Anderson",
    status: "Qualified",
    lastUpdated: "Mar 26, 2025",
    daysOld: 4,
  },
  {
    id: "LD-004",
    dealerId: "DLR-7890",
    anchorId: "ANC-3456",
    rmName: "Emily Davis",
    psmName: "James Wilson",
    status: "Proposal",
    lastUpdated: "Mar 25, 2025",
    daysOld: 5,
  },
  {
    id: "LD-005",
    dealerId: "DLR-1234",
    anchorId: "ANC-7890",
    rmName: "David Wilson",
    psmName: "Sarah Thompson",
    status: "Negotiation",
    lastUpdated: "Mar 24, 2025",
    daysOld: 6,
  },
]

const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Qualified: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Proposal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  Negotiation: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Closed Won": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Closed Lost": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState("week")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                {timePeriod === "week" ? "This Week" : timePeriod === "month" ? "This Month" : "All Time"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimePeriod("week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("all")}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Lead Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {leadSummaryData.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div 
                  className={`p-2 rounded-lg ${item.iconColorClass}`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  {item.change > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">+{item.change}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">{item.change}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</h3>
                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lead Status and Aging Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
            <CardDescription>
              Distribution of leads by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent, midAngle, cx, cy }) => {
                      const radius = 90;
                      // Guard against undefined values
                      if (
                        typeof midAngle !== 'number' ||
                        typeof cx !== 'number' ||
                        typeof cy !== 'number'
                      ) {
                        return null;
                      }
                      const sin = Math.sin(-midAngle * Math.PI / 180);
                      const cos = Math.cos(-midAngle * Math.PI / 180);
                      const sx = cx + (radius + 10) * cos;
                      const sy = cy + (radius + 10) * sin;
                      const textAnchor = cos >= 0 ? 'start' : 'end';
                      
                      return (
                        <text 
                          x={sx} 
                          y={sy} 
                          textAnchor={textAnchor}
                          fill="currentColor"
                          fontSize={12}
                          fontFamily="inherit"
                        >
                          {`${name}: ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {leadStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} leads`, 'Count']}
                    contentStyle={{ fontFamily: 'inherit', fontSize: '12px' }}
                    itemStyle={{ fontFamily: 'inherit' }}
                  />
                  <Legend 
                    formatter={(value) => <span style={{ fontFamily: 'inherit', fontSize: '12px', color: 'inherit' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Aging */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Lead Aging</CardTitle>
            <CardDescription>
              Analysis of lead aging by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadAgingData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontFamily: 'inherit', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontFamily: 'inherit', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ fontFamily: 'inherit', fontSize: '12px' }}
                    itemStyle={{ fontFamily: 'inherit' }}
                  />
                  <Legend 
                    formatter={(value) => <span style={{ fontFamily: 'inherit', fontSize: '12px', color: 'inherit' }}>{value}</span>}
                  />
                  <Bar dataKey="new" stackId="a" name="New" fill="#3b82f6" />
                  <Bar dataKey="contacted" stackId="a" name="Contacted" fill="#8b5cf6" />
                  <Bar dataKey="qualified" stackId="a" name="Qualified" fill="#f59e0b" />
                  <Bar dataKey="proposal" stackId="a" name="Proposal" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>
            Latest leads added to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#1F1F23]">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Lead ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Dealer ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Anchor ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">RM Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">PSM Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Aging</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{lead.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.dealerId}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.anchorId}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.rmName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{lead.psmName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          statusColors[lead.status]
                        )}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {lead.daysOld} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" size="sm">View All Leads</Button>
        </CardFooter>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Conversion Funnel</CardTitle>
          <CardDescription>
            Conversion rates across lead stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">New Leads</span>
                <span className="text-gray-500 dark:text-gray-400">65 leads (100%)</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Contacted</span>
                <span className="text-gray-500 dark:text-gray-400">45 leads (69%)</span>
              </div>
              <Progress value={69} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Qualified</span>
                <span className="text-gray-500 dark:text-gray-400">40 leads (62%)</span>
              </div>
              <Progress value={62} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Proposal</span>
                <span className="text-gray-500 dark:text-gray-400">35 leads (54%)</span>
              </div>
              <Progress value={54} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Negotiation</span>
                <span className="text-gray-500 dark:text-gray-400">30 leads (46%)</span>
              </div>
              <Progress value={46} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Closed Won</span>
                <span className="text-gray-500 dark:text-gray-400">20 leads (31%)</span>
              </div>
              <Progress value={31} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
