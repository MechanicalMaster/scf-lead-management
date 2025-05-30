"use client"

import { useState, useEffect } from "react"
import MasterLayout from "./master-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MasterService } from "@/lib/db"
import type { AnchorMaster } from "@/lib/db"
import dbUtils from "@/lib/dbUtils"

export default function AnchorMaster() {
  const [anchors, setAnchors] = useState<AnchorMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load anchor data from IndexedDB
    const loadAnchors = async () => {
      try {
        setLoading(true);
        const result = await MasterService.getRecords('anchor_master');
        
        if (result.success && result.data) {
          // Type assertion to ensure correct type
          setAnchors(result.data as AnchorMaster[]);
        } else {
          setError("Failed to load anchor data");
        }
      } catch (err) {
        console.error("Error loading anchors:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadAnchors();
  }, []);

  return (
    <MasterLayout 
      title="Anchor Master" 
      description="Manage anchor institutions and their details"
      storeName="anchor_master"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 dark:border-gray-700 rounded-full border-t-blue-600 dark:border-t-blue-500"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading anchors...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-4 my-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anchor Name</TableHead>
                <TableHead>Anchor UUID</TableHead>
                <TableHead>Program Name</TableHead>
                <TableHead>Program UUID</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>PSM Name</TableHead>
                <TableHead>PSM ADID</TableHead>
                <TableHead>PSM Email</TableHead>
                <TableHead>UDF1</TableHead>
                <TableHead>UDF2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anchors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No anchor data available. Use the Upload tab to add data.
                  </TableCell>
                </TableRow>
              ) : (
                anchors.map((anchor, idx) => (
                  <TableRow key={anchor.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/10">
                    <TableCell>{anchor.anchorname}</TableCell>
                    <TableCell>{anchor.anchoruuid}</TableCell>
                    <TableCell>{anchor.programname}</TableCell>
                    <TableCell>{anchor.programuuid}</TableCell>
                    <TableCell>{anchor.segment}</TableCell>
                    <TableCell>{anchor.PSMName}</TableCell>
                    <TableCell>{anchor.PSMADID}</TableCell>
                    <TableCell>{anchor.PSMEmail}</TableCell>
                    <TableCell>{anchor.UDF1}</TableCell>
                    <TableCell>{anchor.UDF2}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </MasterLayout>
  )
}
