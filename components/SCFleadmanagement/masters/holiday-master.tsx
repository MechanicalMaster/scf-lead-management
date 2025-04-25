"use client"

import MasterLayout from "./master-layout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
      <div className="mb-6 flex gap-4">
        <Input
          type="date"
          value={newHoliday.date}
          onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
          placeholder="Date"
          className="w-40"
        />
        <Input
          value={newHoliday.name}
          onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
          placeholder="Holiday Name"
          className="w-48"
        />
        <Input
          value={newHoliday.type}
          onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
          placeholder="Type (e.g. Public, Restricted)"
          className="w-48"
        />
        <Input
          value={newHoliday.description}
          onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
          placeholder="Description"
          className="w-64"
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
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
