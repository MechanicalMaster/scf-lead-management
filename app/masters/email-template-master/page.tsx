"use client"

import dynamic from "next/dynamic";
import { Loader2, RefreshCw } from "lucide-react";
import Layout from "@/components/SCFleadmanagement/layout";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { resetDatabase } from "@/lib/db-init";

// Dynamically import the EmailTemplateMaster component to ensure it's only loaded client-side
const EmailTemplateMaster = dynamic(
  () => import("@/components/SCFleadmanagement/masters/email-template-master"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    ),
    ssr: false,
  }
);

export default function EmailTemplateMasterPage() {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetDatabase = async () => {
    if (confirm("⚠️ WARNING: This will completely reset ALL data in the application. This action cannot be undone. Are you sure you want to continue?")) {
      setResetting(true);
      try {
        await resetDatabase();
        window.location.reload();
      } catch (err: any) {
        console.error("Error resetting database:", err);
        setError(err.message || "Failed to reset database");
        setResetting(false);
      }
    }
  };

  return (
    <Layout>
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Email Template Master</h1>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleResetDatabase}
            disabled={resetting}
          >
            {resetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting Database...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All Data
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 mt-2">
            {error}
          </div>
        )}
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <EmailTemplateMaster />
      </Suspense>
    </Layout>
  );
} 