"use client"

import MasterLayout from "./master-layout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadTemplate } from "@/lib/downloadTemplate"

interface Holiday {
  id: string
  date: string
  name: string
  type: string
  description: string
}

export default function HolidayMaster() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [newHoliday, setNewHoliday] = useState<Holiday>({
    id: "",
    date: "",
    name: "",
    type: "",
    description: "",
  })

  const handleAdd = () => {
    setHolidays([
      ...holidays,
      { ...newHoliday, id: Date.now().toString() },
    ])
    setNewHoliday({ id: "", date: "", name: "", type: "", description: "" })
  }

  return (
    <MasterLayout title="Holiday Master" description="Manage holidays for your organization">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => downloadTemplate(["Date", "Name", "Type", "Description"], "holiday_template.xlsx")}
        >
          Download Template
        </Button>
      </div>
      {/* Removed manual add fields as per user request */}
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Description</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map((h) => (
            <tr key={h.id}>
              <td className="p-2 border">{h.date}</td>
              <td className="p-2 border">{h.name}</td>
              <td className="p-2 border">{h.type}</td>
              <td className="p-2 border">{h.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MasterLayout>
  )
}
