"use client"

import dynamic from 'next/dynamic'
import Layout from "@/components/SCFleadmanagement/layout"
import { Suspense } from "react"
import { useParams } from "next/navigation"

// Use dynamic import with SSR disabled to prevent hydration issues
const LeadDetails = dynamic(() => import("@/components/SCFleadmanagement/lead-details"), {
  ssr: false,
})

export default function LeadDetailsPage() {
  const params = useParams();
  const leadId = params.id as string;

  return (
    <Layout>
      <Suspense fallback={<div>Loading lead details...</div>}>
        <LeadDetails leadId={leadId} />
      </Suspense>
    </Layout>
  )
} 