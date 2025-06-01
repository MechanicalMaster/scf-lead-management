"use client"

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import Layout from "@/components/SCFleadmanagement/layout";
import { Suspense } from "react";

// Dynamically import the ProgramReviewLeads component to ensure it's only loaded client-side
const ProgramReviewLeads = dynamic(
  () => import("@/components/SCFleadmanagement/program-review-leads"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    ),
    ssr: false,
  }
);

export default function ProgramReviewPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <ProgramReviewLeads />
      </Suspense>
    </Layout>
  );
} 