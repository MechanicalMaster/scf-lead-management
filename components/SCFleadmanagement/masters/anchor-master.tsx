"use client"

import MasterLayout from "./master-layout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Anchor {
  id: string
  code: string
  name: string
  status: string
  description: string
}

export default function AnchorMaster() {
  const [anchors, setAnchors] = useState<Anchor[]>([])
  const [newAnchor, setNewAnchor] = useState<Anchor>({
    id: "",
    code: "",
    name: "",
    status: "Active",
    description: "",
  })

  const handleAdd = () => {
    setAnchors([
      ...anchors,
      { ...newAnchor, id: Date.now().toString() },
    ])
    setNewAnchor({ id: "", code: "", name: "", status: "Active", description: "" })
  }

  return (
    <MasterLayout title="Anchor Master" description="Manage anchor institutions and their details">
      <div className="mb-6 flex gap-4">
        <Input
          value={newAnchor.code}
          onChange={e => setNewAnchor({ ...newAnchor, code: e.target.value })}
          placeholder="Anchor Code"
          className="w-32"
        />
        <Input
          value={newAnchor.name}
          onChange={e => setNewAnchor({ ...newAnchor, name: e.target.value })}
          placeholder="Anchor Name"
          className="w-48"
        />
        <Input
          value={newAnchor.status}
          onChange={e => setNewAnchor({ ...newAnchor, status: e.target.value })}
          placeholder="Status (Active/Inactive)"
          className="w-32"
        />
        <Input
          value={newAnchor.description}
          onChange={e => setNewAnchor({ ...newAnchor, description: e.target.value })}
          placeholder="Description"
          className="w-64"
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 border">Code</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Description</th>
          </tr>
        </thead>
        <tbody>
          {anchors.map((a) => (
            <tr key={a.id}>
              <td className="p-2 border">{a.code}</td>
              <td className="p-2 border">{a.name}</td>
              <td className="p-2 border">{a.status}</td>
              <td className="p-2 border">{a.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MasterLayout>
  )
}
