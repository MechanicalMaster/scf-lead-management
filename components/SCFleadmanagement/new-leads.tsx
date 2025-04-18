"use client"

import { useState } from "react"
import { Download, Upload, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type UploadStatus = "idle" | "processing" | "partial" | "success" | "failed"
type RowStatus = "success" | "failed" | "warning"

interface UploadResult {
  total: number
  success: number
  failed: number
  rows: {
    rowNumber: number
    dealerId: string
    anchorId: string
    rmName: string
    status: RowStatus
    error?: string
  }[]
}

export default function NewLeads() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setUploadStatus("idle")
    setUploadResult(null)
  }

  const handleDownloadTemplate = () => {
    // In a real application, this would generate and download an Excel template
    console.log("Downloading template...")
    // Mock implementation - would be replaced with actual API call
    const link = document.createElement("a")
    link.href = "/api/leads/template" // This would be a real endpoint in production
    link.download = "lead_upload_template.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpload = () => {
    if (!selectedFile) return

    setUploadStatus("processing")

    // Simulate API call to upload and process file
    setTimeout(() => {
      // Mock response - in real implementation this would come from the server
      const mockResult: UploadResult = {
        total: 5,
        success: 3,
        failed: 2,
        rows: [
          {
            rowNumber: 1,
            dealerId: "DLR-1234",
            anchorId: "ANC-5678",
            rmName: "John Smith",
            status: "success",
          },
          {
            rowNumber: 2,
            dealerId: "DLR-2345",
            anchorId: "ANC-6789",
            rmName: "Jane Doe",
            status: "success",
          },
          {
            rowNumber: 3,
            dealerId: "DLR-3456",
            anchorId: "ANC-7890",
            rmName: "Robert Johnson",
            status: "success",
          },
          {
            rowNumber: 4,
            dealerId: "DLR-4567",
            anchorId: "",
            rmName: "Emily Davis",
            status: "failed",
            error: "Anchor ID is required",
          },
          {
            rowNumber: 5,
            dealerId: "DLR-5678",
            anchorId: "ANC-9012",
            rmName: "",
            status: "failed",
            error: "RM Name is required",
          },
        ],
      }

      setUploadResult(mockResult)
      
      if (mockResult.failed === 0) {
        setUploadStatus("success")
      } else if (mockResult.success === 0) {
        setUploadStatus("failed")
      } else {
        setUploadStatus("partial")
      }
    }, 1500) // Simulate processing time
  }

  const handleDownloadResults = () => {
    if (!uploadResult) return
    
    // In a real application, this would generate and download an Excel with results
    console.log("Downloading results...")
    // Mock implementation - would be replaced with actual API call
    const link = document.createElement("a")
    link.href = "/api/leads/results" // This would be a real endpoint in production
    link.download = "lead_upload_results.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderUploadAlert = () => {
    switch (uploadStatus) {
      case "processing":
        return (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processing</AlertTitle>
            <AlertDescription>Your file is being processed. Please wait...</AlertDescription>
          </Alert>
        )
      case "success":
        return (
          <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              All {uploadResult?.total} leads were successfully uploaded.
            </AlertDescription>
          </Alert>
        )
      case "failed":
        return (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Failed</AlertTitle>
            <AlertDescription>
              None of the leads could be uploaded. Please check the errors and try again.
            </AlertDescription>
          </Alert>
        )
      case "partial":
        return (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">Partial Success</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              {uploadResult?.success} out of {uploadResult?.total} leads were uploaded successfully. 
              {uploadResult?.failed} leads failed - please check the errors below.
            </AlertDescription>
          </Alert>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Leads</h1>
      </div>

      <Tabs defaultValue="bulkUpload" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="bulkUpload">Bulk Upload</TabsTrigger>          
        </TabsList>
        
        <TabsContent value="bulkUpload">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Leads</CardTitle>
              <CardDescription>
                Upload multiple leads at once using an Excel file. Download the template to ensure your data is formatted correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileUpload">Upload Excel File</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Supported formats: .xlsx, .xls
                  </p>
                </div>

                {renderUploadAlert()}

                {uploadResult && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Upload Results</h3>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                        <p className="text-sm text-green-800 dark:text-green-300">Success</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                          {uploadResult.success}
                        </p>
                      </div>
                      <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                        <p className="text-sm text-red-800 dark:text-red-300">Failed</p>
                        <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                          {uploadResult.failed}
                        </p>
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-md">
                        <p className="text-sm text-gray-800 dark:text-gray-300">Total</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-300">
                          {uploadResult.total}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Dealer ID</TableHead>
                            <TableHead>Anchor ID</TableHead>
                            <TableHead>RM Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadResult.rows.map((row) => (
                            <TableRow key={row.rowNumber}>
                              <TableCell>{row.rowNumber}</TableCell>
                              <TableCell>{row.dealerId}</TableCell>
                              <TableCell>{row.anchorId}</TableCell>
                              <TableCell>{row.rmName}</TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                    {
                                      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
                                        row.status === "success",
                                      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300":
                                        row.status === "failed",
                                      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300":
                                        row.status === "warning",
                                    }
                                  )}
                                >
                                  {row.status === "success" && <CheckCircle className="mr-1 h-3 w-3" />}
                                  {row.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                                  {row.status === "warning" && <AlertCircle className="mr-1 h-3 w-3" />}
                                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell className="text-red-600 dark:text-red-400">
                                {row.error || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={handleDownloadResults} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Results
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            {/* New Summary Section */}
            <CardContent>
              <h3 className="text-lg font-medium mb-4">Upload Summary</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Uploaded File</TableHead>
                      <TableHead>Uploaded Date</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { "Uploaded File": "Poly100425.xlsx", "Uploaded Date": "10-Apr-2025", "Uploaded By": "pratiksha bane", "Status": "Success", "Response": "Poly100425_result.xlsx" },
                      { "Uploaded File": "Halonix 090425.xlsx", "Uploaded Date": "10-Apr-2025", "Uploaded By": "Asmita Umtekar", "Status": "Success", "Response": "Halonix 090425_result.xlsx" },
                      { "Uploaded File": "Poly100425.xlsx", "Uploaded Date": "10-Apr-2025", "Uploaded By": "pratiksha bane", "Status": "Failure", "Response": "Poly100425_result.xlsx" },
                      { "Uploaded File": "Poly100425.xlsx", "Uploaded Date": "10-Apr-2025", "Uploaded By": "pratiksha bane", "Status": "Failure", "Response": "Poly100425_result.xlsx" }
                    ].map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row["Uploaded File"]}</TableCell>
                        <TableCell>{row["Uploaded Date"]}</TableCell>
                        <TableCell>{row["Uploaded By"]}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              {
                                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
                                  row.Status === "Success",
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300":
                                  row.Status === "Failure",
                              }
                            )}
                          >
                            {row.Status === "Success" && <CheckCircle className="mr-1 h-3 w-3" />}
                            {row.Status === "Failure" && <XCircle className="mr-1 h-3 w-3" />}
                            {row.Status}
                          </span>
                        </TableCell>
                        <TableCell>{row.Response}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpload} disabled={!selectedFile || uploadStatus === "processing"} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Leads
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}