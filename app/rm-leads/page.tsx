"use client"

import dynamic from 'next/dynamic'
import Layout from "@/components/SCFleadmanagement/layout"
import { Suspense } from "react"

// Use dynamic import with SSR disabled to prevent hydration issues
const RMLeads = dynamic(() => import("@/components/SCFleadmanagement/rm-leads"), {
  ssr: false,
})

export default function RMLeadsPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading leads...</div>}>
        <RMLeads />
      </Suspense>
    </Layout>
  )
} 