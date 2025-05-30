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
import db, { MasterService } from "@/lib/db"
import { useAuth } from "@/components/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LEAD_TEMPLATE_HEADERS, ERROR_CODES } from "@/lib/constants"
import type { PincodeBranch, RMBranch, ErrorCodeMaster, ProcessedLead } from "@/lib/db"
import { v4 as uuidv4 } from 'uuid';
import { handleNewLeadAssignment } from "@/lib/lead-workflow-examples"
import { getEmailFromRmAdid, getPSMDetailsFromAnchor } from "@/lib/lead-utils"

type UploadStatus = "idle" | "processing" | "validating" | "partial" | "success" | "failed"
type RowStatus = "success" | "failed" | "warning"

interface UploadResultRow {
  rowNumber: number; // This is the originalExcelRowNumber
  dealerId: string; // Key field from Excel for display
  anchorId: string; // Key field from Excel for display
  rmName: string; // Original RM Name from Excel, if any
  assignedRmAdid?: string; // The finally assigned RM ADID
  status: RowStatus; // UI status: 'success', 'failed'
  error?: string; // This will be the errorDescription for UI
}

interface UploadResult {
  total: number;
  success: number;
  failed: number;
  rows: UploadResultRow[]; // For UI display
  uploadBatchId?: string; // Added to link with processed leads
}

interface UploadHistoryItem {
  fileName: string
  uploadDate: string
  uploadedBy: string
  status: "Success" | "Failure"
  responseFile: string
  uploadBatchId?: string // Added for reference to processed leads
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
  const [fileValidationMessage, setFileValidationMessage] = useState<string>("")
  const [isFileValid, setIsFileValid] = useState<boolean>(false)
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setUploadStatus("idle")
    setUploadResult(null)
    setFileValidationMessage("")
    setIsFileValid(false)
    
    // Validate file headers if a file is selected
    if (file) {
      try {
        setUploadStatus("validating")
        
        // Read the file
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Extract headers from the first row
        const headers: string[] = []
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({r: range.s.r, c: C})]
          headers.push(cell?.v || '')
        }
        
        // Check if all required headers are present
        const missingHeaders = LEAD_TEMPLATE_HEADERS.filter(header => 
          !headers.includes(header)
        )
        
        if (missingHeaders.length > 0) {
          setFileValidationMessage(`Invalid file format. Missing headers: ${missingHeaders.join(', ')}`)
          setIsFileValid(false)
          setUploadStatus("idle")
        } else {
          setFileValidationMessage("File format is valid. Ready to upload.")
          setIsFileValid(true)
          setUploadStatus("idle")
        }
      } catch (error) {
        console.error("Error validating file:", error)
        setFileValidationMessage("Error validating file. Please try again.")
        setIsFileValid(false)
        setUploadStatus("idle")
      }
    }
  }

  const handleDownloadTemplate = () => {
    MasterService.downloadLeadTemplate();
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedAnchor || !selectedProgram) {
      alert("Please select both Anchor and Program before uploading");
      return;
    }

    if (!isFileValid) {
      alert("Please select a valid file with the correct headers");
      return;
    }

    setUploadStatus("processing");
    console.log("=== Starting lead upload process ===");
    console.log(`Selected anchor: ${selectedAnchor}, program: ${selectedProgram}`);

    try {
      // Generate a unique ID for this upload batch
      const uploadBatchId = uuidv4();
      console.log(`Generated upload batch ID: ${uploadBatchId}`);
      
      // Read the file
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];
      console.log(`Parsed ${jsonData.length} rows from Excel file`);
      
      // Prepare the upload result
      const uploadResult: UploadResult = {
        total: jsonData.length,
        success: 0,
        failed: 0,
        rows: [],
        uploadBatchId
      };
      
      // Fetch the required master data for lookups
      console.log("Fetching master data for lead assignment...");
      const [pincodeResult, rmBranchResult, errorCodesResult] = await Promise.all([
        MasterService.getRecords('pincode_branch', {}, undefined, 1000, 0),
        MasterService.getRecords('rm_branch', {}, undefined, 1000, 0),
        MasterService.getRecords('error_codes', {}, undefined, 1000, 0)
      ]);
      
      // Create maps for efficient lookups
      const pincodeMap = new Map<string, PincodeBranch>();
      const rmBranchMapByBranchCode = new Map<string, RMBranch[]>();
      const errorCodesMap = new Map<string, string>();
      
      if (pincodeResult.success && pincodeResult.data) {
        (pincodeResult.data as PincodeBranch[]).forEach(item => {
          pincodeMap.set(String(item.pincode), item);
        });
        console.log(`Loaded ${pincodeMap.size} pincodes for mapping`);
      }
      
      if (rmBranchResult.success && rmBranchResult.data) {
        (rmBranchResult.data as RMBranch[]).forEach(item => {
          const branches = rmBranchMapByBranchCode.get(item.branchCode) || [];
          branches.push(item);
          rmBranchMapByBranchCode.set(item.branchCode, branches);
        });
        console.log(`Loaded ${rmBranchMapByBranchCode.size} branch codes with RMs`);
      }
      
      if (errorCodesResult.success && errorCodesResult.data) {
        (errorCodesResult.data as ErrorCodeMaster[]).forEach(item => {
          errorCodesMap.set(item.errorCode, item.description);
        });
        console.log(`Loaded ${errorCodesMap.size} error codes`);
      }
      
      // Array to store processed leads for database storage
      const leadsToPersist: ProcessedLead[] = [];
      
      // Process each row
      for (let index = 0; index < jsonData.length; index++) {
        const originalRow = jsonData[index] as Record<string, any>;
        const originalRowNumber = index + 2; // Excel row (1-based with header row)
        
        console.log(`--- Processing row ${originalRowNumber} ---`);
        
        // Initialize the processed lead entry
        const processedLeadEntry: Partial<ProcessedLead> = {
          id: `${uploadBatchId}-${originalRowNumber}`,
          uploadBatchId,
          processedTimestamp: new Date().toISOString(),
          anchorNameSelected: selectedAnchor,
          programNameSelected: selectedProgram,
          originalRowNumber,
          originalData: originalRow,
          assignedRmAdid: null,
          assignmentStatus: "",
          errorCode: null,
          errorDescription: null
        };
        
        // Initialize UI row object
        const uiRow: UploadResultRow = {
          rowNumber: originalRowNumber,
          dealerId: String(originalRow["Name of the Firm"] || `Row ${originalRowNumber}`),
          anchorId: String(originalRow["PAN Number"] || ""),
          rmName: String(originalRow["RM ADID"] || ""),
          status: "failed", // Default to failed, change if successful
          error: ""
        };
        
        // Check if RM ADID is already provided in the Excel
        if (originalRow["RM ADID"] && String(originalRow["RM ADID"]).trim() !== "") {
          const rmAdid = String(originalRow["RM ADID"]);
          console.log(`Row ${originalRowNumber}: Manual RM assignment found - ${rmAdid}`);
          
          processedLeadEntry.assignedRmAdid = rmAdid;
          processedLeadEntry.assignmentStatus = "RM Assigned (Manual)";
          processedLeadEntry.errorCode = "INFO_RM_MANUAL";
          processedLeadEntry.errorDescription = "RM assigned from Excel";
          
          uiRow.assignedRmAdid = rmAdid;
          uiRow.status = "success";
          uploadResult.success++;
        } else {
          // Automatic assignment based on pincode
          const pincode = String(originalRow["Pincode"] || "").trim();
          console.log(`Row ${originalRowNumber}: Attempting automatic RM assignment for pincode ${pincode}`);
          
          if (!pincode) {
            console.log(`Row ${originalRowNumber}: No pincode provided`);
            processedLeadEntry.errorCode = "ERR_PIN_NF";
            processedLeadEntry.assignmentStatus = "Failed: Pincode not found";
            uiRow.error = "Pincode not found";
            uploadResult.failed++;
          } else {
            const pincodeEntry = pincodeMap.get(pincode);
            
            if (!pincodeEntry) {
              console.log(`Row ${originalRowNumber}: Pincode ${pincode} not found in master data`);
              processedLeadEntry.errorCode = "ERR_PIN_NF";
              processedLeadEntry.assignmentStatus = "Failed: Pincode not found";
              uiRow.error = "Pincode not found";
              uploadResult.failed++;
            } else {
              const branchCode = pincodeEntry.branchCode;
              console.log(`Row ${originalRowNumber}: Pincode ${pincode} mapped to branch ${branchCode}`);
              
              const rmList = rmBranchMapByBranchCode.get(branchCode) || [];
              
              if (rmList.length === 0) {
                console.log(`Row ${originalRowNumber}: No RMs found for branch ${branchCode}`);
                processedLeadEntry.errorCode = "ERR_BR_NMAP";
                processedLeadEntry.assignmentStatus = "Failed: Branch not mapped to RM";
                uiRow.error = "Branch not mapped to RM";
                uploadResult.failed++;
              } else {
                // Find active RM first, then any RM
                const activeRM = rmList.find(rm => rm.active);
                const anyRM = rmList[0];
                const selectedRM = activeRM || anyRM;
                
                if (selectedRM) {
                  const rmAdid = selectedRM.rmId;
                  console.log(`Row ${originalRowNumber}: Assigned to RM ${rmAdid} (${selectedRM.rmName})`);
                  
                  processedLeadEntry.assignedRmAdid = rmAdid;
                  processedLeadEntry.assignmentStatus = "RM Assigned (Auto)";
                  processedLeadEntry.errorCode = "INFO_RM_AUTO";
                  processedLeadEntry.errorDescription = "RM assigned automatically";
                  
                  uiRow.assignedRmAdid = rmAdid;
                  uiRow.status = "success";
                  uploadResult.success++;
                } else {
                  console.log(`Row ${originalRowNumber}: Failed to find RM for branch ${branchCode}`);
                  processedLeadEntry.errorCode = "ERR_RM_NBR";
                  processedLeadEntry.assignmentStatus = "Failed: No RM for Branch";
                  uiRow.error = "No RM for Branch";
                  uploadResult.failed++;
                }
              }
            }
          }
        }
        
        // Make sure error description is set
        if (processedLeadEntry.errorCode && !processedLeadEntry.errorDescription) {
          processedLeadEntry.errorDescription = errorCodesMap.get(processedLeadEntry.errorCode) || processedLeadEntry.errorCode;
        }
        
        // Update UI row error display
        if (uiRow.status === "failed" && !uiRow.error) {
          uiRow.error = processedLeadEntry.errorDescription || "Unknown error";
        }
        
        // Add to arrays
        leadsToPersist.push(processedLeadEntry as ProcessedLead);
        uploadResult.rows.push(uiRow);
      }
      
      // Save all processed leads to database
      try {
        console.log(`Saving ${leadsToPersist.length} processed leads to database...`);
        // Using the processed_leads table we created
        await db.processed_leads.bulkAdd(leadsToPersist);
        console.log(`Successfully saved ${leadsToPersist.length} leads to database`);
        
        console.log("=== Starting email generation for assigned leads ===");
        // Add new code here to create lead workflow records with emails
        // Process each successful lead assignment
        let emailSuccessCount = 0;
        let emailFailCount = 0;
        
        for (const lead of leadsToPersist) {
          // Only process leads that have been successfully assigned to an RM
          if (lead.assignmentStatus === "RM Assigned (Manual)" || lead.assignmentStatus === "RM Assigned (Auto)") {
            try {
              console.log(`Processing lead ${lead.id} for email...`);
              // Get the RM's email
              const rmAdid = lead.assignedRmAdid as string;
              console.log(`Getting email for RM ${rmAdid}...`);
              const rmEmail = await getEmailFromRmAdid(rmAdid);
              console.log(`Found RM email: ${rmEmail}`);
              
              // Get PSM details for the anchor
              console.log(`Getting PSM details for anchor ${lead.anchorNameSelected}...`);
              const [psmAdid, psmEmail] = await getPSMDetailsFromAnchor(lead.anchorNameSelected);
              console.log(`Found PSM: ${psmAdid} (${psmEmail})`);
              
              // Create the workflow record and send the simulated email
              console.log(`Creating workflow record and sending email notification...`);
              await handleNewLeadAssignment(lead.id, rmAdid, rmEmail, psmAdid);
              
              console.log(`✅ Email successfully sent for lead ${lead.id} to RM ${rmAdid} (${rmEmail})`);
              emailSuccessCount++;
            } catch (error) {
              // Log the error but don't fail the overall upload
              console.error(`❌ Error creating lead workflow for ${lead.id}:`, error);
              emailFailCount++;
            }
          } else {
            console.log(`Skipping email for lead ${lead.id} - assignment status: ${lead.assignmentStatus}`);
          }
        }
        
        console.log(`=== Email generation summary ===`);
        console.log(`Total leads processed: ${leadsToPersist.length}`);
        console.log(`Emails sent successfully: ${emailSuccessCount}`);
        console.log(`Emails failed: ${emailFailCount}`);
        
      } catch (dbError) {
        console.error("Error saving processed leads:", dbError);
      }
      
      // Update the UI with the result
      setUploadResult(uploadResult);
      
      // Determine overall upload status
      const status = uploadResult.failed === 0 ? "Success" : "Failure";
      
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
        responseFile: `${selectedFile.name.split('.')[0]}_result.xlsx`,
        uploadBatchId
      };
      
      // Update history with new entry at the beginning
      setUploadHistory(prev => [newHistoryEntry, ...prev]);
      
      // Update upload status for the UI
      if (uploadResult.failed === 0) {
        setUploadStatus("success");
      } else if (uploadResult.success === 0) {
        setUploadStatus("failed");
      } else {
        setUploadStatus("partial");
      }
      
      console.log(`=== Lead upload process completed ===`);
      
    } catch (error) {
      console.error("❌ Error processing file:", error);
      setUploadStatus("failed");
    }
  }

  const handleDownloadResults = async () => {
    if (!uploadResult || !uploadResult.uploadBatchId) return;
    
    try {
      // Fetch the processed leads from the database
      const processedLeads = await db.processed_leads
        .where('uploadBatchId')
        .equals(uploadResult.uploadBatchId)
        .toArray();
      
      if (processedLeads.length === 0) {
        console.error("No processed leads found for this batch");
        return;
      }
      
      // Define headers for the response Excel including assignment results
      const responseExcelHeaders = [
        ...LEAD_TEMPLATE_HEADERS, 
        "Assigned RM ADID", 
        "Assignment Status", 
        "Error Code", 
        "Error Description"
      ];
      
      // Create sheet data with headers as first row
      const sheetData = [responseExcelHeaders];
      
      // Add each processed lead to the sheet data
      processedLeads.forEach((lead) => {
        const excelRow: any[] = [];
        
        // Add original data in the same order as the template headers
        LEAD_TEMPLATE_HEADERS.forEach(header => {
          // Get value from originalData or empty string if not found
          const value = lead.originalData[header] || '';
          excelRow.push(value);
        });
        
        // Add assignment results
        excelRow.push(lead.assignedRmAdid || '');
        excelRow.push(lead.assignmentStatus || '');
        excelRow.push(lead.errorCode || '');
        excelRow.push(lead.errorDescription || '');
        
        // Add row to sheet data
        sheetData.push(excelRow);
      });
      
      // Create Excel workbook and download
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Processed Leads');
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `lead_upload_results_${uploadResult.uploadBatchId}.xlsx`);
      
    } catch (error) {
      console.error("Error downloading results:", error);
    }
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
                  
                  {fileValidationMessage && (
                    <div className={`mt-2 text-sm p-2 rounded ${isFileValid ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                      {fileValidationMessage}
                    </div>
                  )}
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