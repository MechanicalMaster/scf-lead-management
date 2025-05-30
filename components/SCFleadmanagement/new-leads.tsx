"use client"

import { useState, useEffect } from "react"
import { Download, Upload, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { MasterService } from "@/lib/db"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface UploadHistoryItem {
  fileName: string
  uploadDate: string
  uploadedBy: string
  status: "Success" | "Failure"
  responseFile: string
}

export default function NewLeads() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [anchorNamesList, setAnchorNamesList] = useState<string[]>([])
  const [programNamesList, setProgramNamesList] = useState<string[]>([])
  const [selectedAnchor, setSelectedAnchor] = useState<string>("")
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([])
  const { userEmail } = useAuth()

  // Fetch anchor and program names on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const anchorsResult = await MasterService.getUniqueAnchorNames();
        const programsResult = await MasterService.getUniqueProgramNames();
        
        if (anchorsResult.success && anchorsResult.data) {
          setAnchorNamesList(anchorsResult.data as string[]);
        }
        
        if (programsResult.success && programsResult.data) {
          setProgramNamesList(programsResult.data as string[]);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setUploadStatus("idle")
    setUploadResult(null)
  }

  const handleDownloadTemplate = () => {
    // Use the new MasterService method to download the template with specified headers
    MasterService.downloadLeadTemplate();
  }

  const handleUpload = () => {
    if (!selectedFile || !selectedAnchor || !selectedProgram) {
      // Add validation - don't proceed if anchor or program not selected
      alert("Please select both Anchor and Program before uploading");
      return;
    }

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
      
      // Determine upload status
      const isSuccess = mockResult.failed === 0;
      const status = isSuccess ? "Success" : "Failure";
      
      // Format current date (e.g., "10-Apr-2025")
      const currentDate = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      };
      const formattedDate = currentDate.toLocaleDateString('en-US', options)
        .replace(/(\d+) (\w+) (\d+)/, '$1-$2-$3');
      
      // Create new history entry
      const newHistoryEntry: UploadHistoryItem = {
        fileName: selectedFile.name,
        uploadDate: formattedDate,
        uploadedBy: userEmail || "Unknown User",
        status: status as "Success" | "Failure",
        responseFile: `${selectedFile.name.split('.')[0]}_result.xlsx`
      };
      
      // Update history with new entry at the beginning
      setUploadHistory(prev => [newHistoryEntry, ...prev]);
      
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
                {/* Anchor dropdown */}
                <div>
                  <Label htmlFor="anchor">Anchor</Label>
                  <Select 
                    value={selectedAnchor} 
                    onValueChange={setSelectedAnchor}
                  >
                    <SelectTrigger id="anchor" className="w-full">
                      <SelectValue placeholder="Select Anchor" />
                    </SelectTrigger>
                    <SelectContent>
                      {anchorNamesList.map((anchor, index) => (
                        <SelectItem key={index} value={anchor}>
                          {anchor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Program dropdown */}
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Select 
                    value={selectedProgram} 
                    onValueChange={setSelectedProgram}
                  >
                    <SelectTrigger id="program" className="w-full">
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programNamesList.map((program, index) => (
                        <SelectItem key={index} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
            {/* Upload Summary Section */}
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
                    {uploadHistory.length > 0 ? (
                      uploadHistory.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.fileName}</TableCell>
                          <TableCell>{row.uploadDate}</TableCell>
                          <TableCell>{row.uploadedBy}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                {
                                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
                                    row.status === "Success",
                                  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300":
                                    row.status === "Failure",
                                }
                              )}
                            >
                              {row.status === "Success" && <CheckCircle className="mr-1 h-3 w-3" />}
                              {row.status === "Failure" && <XCircle className="mr-1 h-3 w-3" />}
                              {row.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="link" className="p-0 h-auto text-blue-500 hover:text-blue-700">
                              <FileText className="h-4 w-4 mr-1" />
                              {row.responseFile}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No upload history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || !selectedAnchor || !selectedProgram || uploadStatus === "processing"} 
                className="gap-2"
              >
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