"use client"

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import Layout from "@/components/SCFleadmanagement/layout";
import { Suspense } from "react";

// Dynamically import the SmartfinStatusUpdateComponent to ensure it's only loaded client-side
const SmartfinStatusUpdate = dynamic(
  () => import("@/components/SCFleadmanagement/smartfin-update"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    ),
    ssr: false,
  }
);

export default function SmartfinStatusUpdatePage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <SmartfinStatusUpdate />
      </Suspense>
    </Layout>
  );
} 