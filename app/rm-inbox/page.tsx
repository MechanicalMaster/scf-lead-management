"use client"

import dynamic from 'next/dynamic'
import Layout from "@/components/SCFleadmanagement/layout"
import { Suspense } from "react"

// Use dynamic import with SSR disabled to prevent hydration issues
const RMInbox = dynamic(() => import("@/components/SCFleadmanagement/rm-inbox"), {
  ssr: false,
})

export default function RMInboxPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading inbox...</div>}>
        <RMInbox />
      </Suspense>
    </Layout>
  )
} 