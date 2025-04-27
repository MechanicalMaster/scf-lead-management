"use client"

import MasterLayout from "./master-layout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadTemplate } from "@/lib/downloadTemplate"

interface Anchor {
  anchorname: string
  anchoruuid: string
  programname: string
  programuuid: string
  segment: string
  PSMName: string
  PSMADID: string
  PSMEmail: string
  UDF1: string
  UDF2: string
}

const ANCHOR_DATA: Anchor[] = [
  {
    anchorname: "ABC Corp",
    anchoruuid: "uuid-abc-001",
    programname: "Supply Chain Finance",
    programuuid: "uuid-prog-001",
    segment: "Large Corporate",
    PSMName: "John Doe",
    PSMADID: "ADID001",
    PSMEmail: "john.doe@example.com",
    UDF1: "Custom1",
    UDF2: "Custom2"
  },
  // Add more anchors as needed
]

export default function AnchorMaster() {
  const [anchors, setAnchors] = useState<Anchor[]>(ANCHOR_DATA)
  const [newAnchor, setNewAnchor] = useState<Anchor>({
    anchorname: "",
    anchoruuid: "",
    programname: "",
    programuuid: "",
    segment: "",
    PSMName: "",
    PSMADID: "",
    PSMEmail: "",
    UDF1: "",
    UDF2: ""
  })

  const handleAdd = () => {
    setAnchors([
      ...anchors,
      { ...newAnchor, anchoruuid: Date.now().toString() },
    ])
    setNewAnchor({
      anchorname: "",
      anchoruuid: "",
      programname: "",
      programuuid: "",
      segment: "",
      PSMName: "",
      PSMADID: "",
      PSMEmail: "",
      UDF1: "",
      UDF2: ""
    })
  }

  return (
    <MasterLayout title="Anchor Master" description="Manage anchor institutions and their details">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => downloadTemplate([
            "anchorname",
            "anchoruuid",
            "programname",
            "programuuid",
            "segment",
            "PSMName",
            "PSMADID",
            "PSMEmail",
            "UDF1",
            "UDF2"
          ], "anchor_template.xlsx")}
        >
          Download Template
        </Button>
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2">Anchor Name</th>
            <th className="px-4 py-2">Anchor UUID</th>
            <th className="px-4 py-2">Program Name</th>
            <th className="px-4 py-2">Program UUID</th>
            <th className="px-4 py-2">Segment</th>
            <th className="px-4 py-2">PSM Name</th>
            <th className="px-4 py-2">PSM ADID</th>
            <th className="px-4 py-2">PSM Email</th>
            <th className="px-4 py-2">UDF1</th>
            <th className="px-4 py-2">UDF2</th>
          </tr>
        </thead>
        <tbody>
          {anchors.map((anchor, idx) => (
            <tr key={idx}>
              <td className="border px-4 py-2">{anchor.anchorname}</td>
              <td className="border px-4 py-2">{anchor.anchoruuid}</td>
              <td className="border px-4 py-2">{anchor.programname}</td>
              <td className="border px-4 py-2">{anchor.programuuid}</td>
              <td className="border px-4 py-2">{anchor.segment}</td>
              <td className="border px-4 py-2">{anchor.PSMName}</td>
              <td className="border px-4 py-2">{anchor.PSMADID}</td>
              <td className="border px-4 py-2">{anchor.PSMEmail}</td>
              <td className="border px-4 py-2">{anchor.UDF1}</td>
              <td className="border px-4 py-2">{anchor.UDF2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MasterLayout>
  )
}
