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
import { getEmailFromRmAdid, getPSMDetailsFromAnchor, safeHandleNewLeadAssignment } from "@/lib/lead-utils"
import { uploadLeadToSmartfin } from "@/lib/smartfin-api"

type UploadStatus = "idle" | "processing" | "validating" | "partial" | "success" | "failed"
type SmartfinUploadStatus = "idle" | "processing" | "partial" | "success" | "failed"
type RowStatus = "success" | "failed" | "warning"

interface UploadResultRow {
  rowNumber: number; // This is the originalExcelRowNumber
  dealerId: string; // Key field from Excel for display
  anchorId: string; // Key field from Excel for display
  rmName: string; // Original RM Name from Excel, if any
  assignedRmAdid?: string; // The finally assigned RM ADID
  status: RowStatus; // UI status: 'success', 'failed'
  error?: string; // This will be the errorDescription for UI
  smartfinStatus?: 'pending' | 'success' | 'failed'; // Smartfin upload status
  smartfinDealerId?: string; // Smartfin Dealer ID if successful
  smartfinError?: string; // Smartfin error description if failed
}

interface UploadResult {
  total: number;
  success: number;
  failed: number;
  rows: UploadResultRow[]; // For UI display
  uploadBatchId?: string; // Added to link with processed leads
}

interface SmartfinUploadResult {
  total: number;
  success: number;
  failed: number;
  rows: UploadResultRow[]; // For UI display with Smartfin status
  uploadBatchId: string; // Same as the original upload batch ID
}

interface UploadHistoryItem {
  fileName: string
  uploadDate: string
  uploadedBy: string
  status: "Success" | "Failure"
  responseFile: string
  uploadBatchId?: string // Added for reference to processed leads
  uploadStep?: 'local_processing' | 'smartfin_upload' // Added to differentiate between the two types of uploads
}

// Near the top of the file, before the SmartfinUpload function
// Add a helper function to ensure we have non-undefined values
const ensureString = (value: string | null | undefined): string => {
  return value || '';
};

export default function NewLeads() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [smartfinUploadStatus, setSmartfinUploadStatus] = useState<SmartfinUploadStatus>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [smartfinUploadResult, setSmartfinUploadResult] = useState<SmartfinUploadResult | null>(null)
  const [showSmartfinUploadButton, setShowSmartfinUploadButton] = useState<boolean>(false)
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
    setShowSmartfinUploadButton(false); // Reset the Smartfin upload button visibility
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
          errorDescription: null,
          smartfinUploadStatus: null, // Initialize Smartfin fields
          smartfinDealerId: null,
          smartfinErrorCode: null,
          smartfinErrorDescription: null
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
        
        // If the lead was successfully assigned (either by RM ADID or by pincode lookup),
        // set its smartfinUploadStatus to 'pending' instead of calling handleNewLeadAssignment immediately
        if (processedLeadEntry.assignmentStatus === "RM Assigned (Auto)" || 
            processedLeadEntry.assignmentStatus === "RM Assigned (Manual)") {
          processedLeadEntry.smartfinUploadStatus = 'pending';
        }
        
        // Store the processed lead
        leadsToPersist.push(processedLeadEntry as ProcessedLead);
        
        // Add the row to the UI results
        uploadResult.rows.push({
          rowNumber: originalRowNumber,
          dealerId: String(originalRow["Name of the Firm"] || `Row ${originalRowNumber}`),
          anchorId: String(originalRow["PAN Number"] || ""),
          rmName: String(originalRow["RM ADID"] || ""),
          assignedRmAdid: processedLeadEntry.assignedRmAdid || undefined,
          status: processedLeadEntry.errorCode ? "failed" : "success",
          error: processedLeadEntry.errorDescription || undefined
        });
      }
      
      console.log(`Processing complete. Success: ${uploadResult.success}, Failed: ${uploadResult.failed}, Total: ${uploadResult.total}`);
      console.log(`Verification check: Success + Failed = ${uploadResult.success + uploadResult.failed}, should equal Total: ${uploadResult.total}`);
      
      // Bulk save processed leads to database
      await db.processed_leads.bulkAdd(leadsToPersist);
      console.log(`Saved ${leadsToPersist.length} processed leads to database`);
      
      // Update UI state
      setUploadResult(uploadResult);
      
      // Determine upload status based on results
      if (uploadResult.success === 0) {
        setUploadStatus("failed");
      } else if (uploadResult.failed > 0) {
        setUploadStatus("partial");
      } else {
        setUploadStatus("success");
      }
      
      // Show Smartfin upload button if there are successful leads
      if (uploadResult.success > 0) {
        setShowSmartfinUploadButton(true);
      }
      
      // Add to upload history
      const newHistoryItem: UploadHistoryItem = {
        fileName: selectedFile.name,
        uploadDate: new Date().toISOString(),
        uploadedBy: userEmail || "Unknown User",
        status: uploadResult.failed === 0 ? "Success" : "Failure",
        responseFile: `${selectedFile.name.split('.')[0]}_response.xlsx`,
        uploadBatchId,
        uploadStep: 'local_processing'
      };
      
      setUploadHistory(prev => [newHistoryItem, ...prev]);
      
    } catch (error) {
      console.error("Error in lead upload process:", error);
      setUploadStatus("failed");
    }
  };

  // New function to handle Smartfin upload
  const handleSmartfinUpload = async () => {
    if (!uploadResult || !uploadResult.uploadBatchId) {
      alert("No upload batch to process");
      return;
    }
    
    setSmartfinUploadStatus("processing");
    console.log("=== Starting Smartfin upload process ===");
    
    try {
      const uploadBatchId = uploadResult.uploadBatchId;
      
      // Retrieve all ProcessedLead records from the current batch with 'pending' Smartfin status
      const pendingLeads = await db.processed_leads
        .where('uploadBatchId')
        .equals(uploadBatchId)
        .and(lead => 
          (lead.assignmentStatus === "RM Assigned (Manual)" || 
           lead.assignmentStatus === "RM Assigned (Auto)") && 
          (lead.smartfinUploadStatus === 'pending' || lead.smartfinUploadStatus === null)
        )
        .toArray();
      
      console.log(`Found ${pendingLeads.length} pending leads for Smartfin upload`);
      
      // Prepare the Smartfin upload result
      const smartfinResult: SmartfinUploadResult = {
        total: pendingLeads.length,
        success: 0,
        failed: 0,
        rows: [],
        uploadBatchId
      };
      
      // Process each pending lead using the Smartfin API
      for (const lead of pendingLeads) {
        console.log(`Processing lead ${lead.id} for Smartfin upload`);
        
        // Call the Smartfin API
        const smartfinResponse = await uploadLeadToSmartfin(lead);
        
        if (smartfinResponse.success) {
          // Get the Smartfin Dealer ID from the response
          const smartfinDealerId = smartfinResponse.smartfinDealerId!;
          
          // Update the lead record in the database
          await db.processed_leads.update(lead.id, {
            smartfinUploadStatus: 'success',
            smartfinDealerId
          });
          
          try {
            // Get the RM's email - ensure no undefined values
            if (!lead.assignedRmAdid) {
              throw new Error('Missing RM ADID');
            }
            
            const rmAdid = lead.assignedRmAdid;
            const rmEmail = await getEmailFromRmAdid(rmAdid);
            
            // Get PSM details for the anchor - use explicit cast to string with default
            const anchorName: string = (lead.anchorNameSelected as string) || '';
            const [psmAdid, psmEmail] = await getPSMDetailsFromAnchor(anchorName);
            
            // Use the safe helper function instead of directly calling handleNewLeadAssignment
            const success = await safeHandleNewLeadAssignment(
              lead.id,
              lead.assignedRmAdid,
              psmAdid
            );
            
            if (!success) {
              throw new Error('Failed to create lead workflow');
            }
            
            // Add to success count
            smartfinResult.success++;
            
            // Add the row to the UI results
            smartfinResult.rows.push({
              rowNumber: lead.originalRowNumber,
              dealerId: lead.originalData["Name of the Firm"] || `Row ${lead.originalRowNumber}`,
              anchorId: lead.originalData["PAN Number"] || "",
              rmName: lead.originalData["RM ADID"] || "",
              assignedRmAdid: lead.assignedRmAdid || undefined,
              status: "success",
              smartfinStatus: 'success',
              smartfinDealerId
            });
          } catch (error) {
            console.error(`Error calling handleNewLeadAssignment for lead ${lead.id}:`, error);
            // Update as failed instead
            await db.processed_leads.update(lead.id, {
              smartfinUploadStatus: 'failed',
              smartfinErrorCode: 'SF999',
              smartfinErrorDescription: 'Error creating lead workflow'
            });
            
            smartfinResult.failed++;
            smartfinResult.rows.push({
              rowNumber: lead.originalRowNumber,
              dealerId: lead.originalData["Name of the Firm"] || `Row ${lead.originalRowNumber}`,
              anchorId: lead.originalData["PAN Number"] || "",
              rmName: lead.originalData["RM ADID"] || "",
              assignedRmAdid: lead.assignedRmAdid || undefined,
              status: "failed",
              smartfinStatus: 'failed',
              smartfinError: 'Error creating lead workflow'
            });
          }
        } else {
          // The Smartfin API call failed
          const smartfinErrorCode = smartfinResponse.errorCode || 'SF000';
          const smartfinErrorDescription = smartfinResponse.errorDescription || 'Unknown Smartfin error';
          
          // Update the lead record in the database
          await db.processed_leads.update(lead.id, {
            smartfinUploadStatus: 'failed',
            smartfinErrorCode,
            smartfinErrorDescription
          });
          
          // Add to failed count
          smartfinResult.failed++;
          
          // Add the row to the UI results
          smartfinResult.rows.push({
            rowNumber: lead.originalRowNumber,
            dealerId: lead.originalData["Name of the Firm"] || `Row ${lead.originalRowNumber}`,
            anchorId: lead.originalData["PAN Number"] || "",
            rmName: lead.originalData["RM ADID"] || "",
            assignedRmAdid: lead.assignedRmAdid || undefined,
            status: "failed",
            smartfinStatus: 'failed',
            smartfinError: smartfinErrorDescription
          });
        }
      }
      
      console.log(`Smartfin processing complete. Success: ${smartfinResult.success}, Failed: ${smartfinResult.failed}`);
      
      // Update UI state
      setSmartfinUploadResult(smartfinResult);
      
      // Determine upload status based on results
      if (smartfinResult.success === 0) {
        setSmartfinUploadStatus("failed");
      } else if (smartfinResult.failed > 0) {
        setSmartfinUploadStatus("partial");
      } else {
        setSmartfinUploadStatus("success");
      }
      
      // Add to upload history
      const newHistoryItem: UploadHistoryItem = {
        fileName: `${selectedFile?.name || 'Unknown'} (Smartfin)`,
        uploadDate: new Date().toISOString(),
        uploadedBy: userEmail || "Unknown User",
        status: smartfinResult.failed === 0 ? "Success" : "Failure",
        responseFile: `${selectedFile?.name?.split('.')[0] || 'smartfin'}_smartfin_response.xlsx`,
        uploadBatchId,
        uploadStep: 'smartfin_upload'
      };
      
      setUploadHistory(prev => [newHistoryItem, ...prev]);
      
    } catch (error) {
      console.error("Error in Smartfin upload process:", error);
      setSmartfinUploadStatus("failed");
    }
  };

  // Function to download Smartfin results
  const handleDownloadSmartfinResults = async () => {
    if (!smartfinUploadResult || !smartfinUploadResult.uploadBatchId) {
      alert("No Smartfin upload results to download");
      return;
    }
    
    try {
      // Fetch all leads from the current upload batch
      const leads = await db.processed_leads
        .where('uploadBatchId')
        .equals(smartfinUploadResult.uploadBatchId)
        .toArray();
      
      // Create an Excel worksheet
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for the worksheet
      const worksheetData = leads.map(lead => {
        // Include original lead data and Smartfin details
        return {
          'Row Number': lead.originalRowNumber,
          'Dealer Name': lead.originalData["Name of the Firm"] || '',
          'PAN': lead.originalData["PAN Number"] || '',
          'Anchor Name': lead.anchorNameSelected,
          'Program Name': lead.programNameSelected,
          'Assigned RM': lead.assignedRmAdid || '',
          'Assignment Status': lead.assignmentStatus,
          'Assignment Error': lead.errorDescription || '',
          'Smartfin Status': lead.smartfinUploadStatus || '',
          'Smartfin Dealer ID': lead.smartfinDealerId || '',
          'Smartfin Error Code': lead.smartfinErrorCode || '',
          'Smartfin Error Description': lead.smartfinErrorDescription || ''
        };
      });
      
      // Create the worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'SmartfinResults');
      
      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `smartfin_results_${smartfinUploadResult.uploadBatchId}.xlsx`;
      saveAs(blob, fileName);
      
    } catch (error) {
      console.error("Error downloading Smartfin results:", error);
      alert("Failed to download Smartfin results");
    }
  };

  // Function to download results (replacing the original handleDownloadResults)
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
  };

  // Function to render Smartfin upload alert
  const renderSmartfinUploadAlert = () => {
    if (smartfinUploadStatus === "idle") return null;
    
    if (smartfinUploadStatus === "processing") {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Processing Smartfin Upload</AlertTitle>
          <AlertDescription>
            Please wait while we upload your leads to Smartfin...
          </AlertDescription>
        </Alert>
      );
    }
    
    if (smartfinUploadStatus === "success") {
      return (
        <Alert className="mb-4 bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/30">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Smartfin Upload Complete</AlertTitle>
          <AlertDescription>
            All leads were successfully uploaded to Smartfin.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (smartfinUploadStatus === "partial") {
      return (
        <Alert className="mb-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Partial Smartfin Upload</AlertTitle>
          <AlertDescription>
            Some leads were successfully uploaded to Smartfin, but others failed. Please review the results.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (smartfinUploadStatus === "failed") {
      return (
        <Alert className="mb-4 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/30">
          <XCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Smartfin Upload Failed</AlertTitle>
          <AlertDescription>
            Failed to upload leads to Smartfin. Please review the errors and try again.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

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
                {renderSmartfinUploadAlert()}

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

                    {/* Add Smartfin Upload Button */}
                    {showSmartfinUploadButton && smartfinUploadStatus === "idle" && (
                      <div className="flex justify-center mb-4">
                        <Button 
                          onClick={handleSmartfinUpload}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload in Smartfin
                        </Button>
                      </div>
                    )}

                    {/* Show Smartfin Results if available */}
                    {smartfinUploadResult && (
                      <div className="mt-6 mb-4">
                        <h3 className="text-lg font-medium mb-2">Smartfin Upload Results</h3>
                        <div className="flex gap-4 mb-4">
                          <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                            <p className="text-sm text-green-800 dark:text-green-300">Success</p>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                              {smartfinUploadResult.success}
                            </p>
                          </div>
                          <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                            <p className="text-sm text-red-800 dark:text-red-300">Failed</p>
                            <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                              {smartfinUploadResult.failed}
                            </p>
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-md">
                            <p className="text-sm text-gray-800 dark:text-gray-300">Total</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-300">
                              {smartfinUploadResult.total}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                            {/* Add Smartfin columns if Smartfin upload has been attempted */}
                            {smartfinUploadResult && (
                              <>
                                <TableHead>Smartfin Status</TableHead>
                                <TableHead>Smartfin ID</TableHead>
                                <TableHead>Smartfin Error</TableHead>
                              </>
                            )}
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
                              <TableCell>{row.error || "-"}</TableCell>
                              {/* Add Smartfin columns if Smartfin upload has been attempted */}
                              {smartfinUploadResult && (
                                <>
                                  <TableCell>
                                    {row.smartfinStatus ? (
                                      <span
                                        className={cn(
                                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                          {
                                            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
                                              row.smartfinStatus === "success",
                                            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300":
                                              row.smartfinStatus === "pending",
                                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300":
                                              row.smartfinStatus === "failed",
                                          }
                                        )}
                                      >
                                        {row.smartfinStatus === "success" && <CheckCircle className="mr-1 h-3 w-3" />}
                                        {row.smartfinStatus === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                                        {row.smartfinStatus === "pending" && <AlertCircle className="mr-1 h-3 w-3" />}
                                        {row.smartfinStatus.charAt(0).toUpperCase() + row.smartfinStatus.slice(1)}
                                      </span>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell>{row.smartfinDealerId || "-"}</TableCell>
                                  <TableCell>{row.smartfinError || "-"}</TableCell>
                                </>
                              )}
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
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleUpload} disabled={!selectedFile || !isFileValid || uploadStatus === "processing" || !selectedAnchor || !selectedProgram}>
                {uploadStatus === "processing" ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Processing...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
              
              {uploadResult && (
                <Button variant="outline" onClick={handleDownloadResults}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Results
                </Button>
              )}
              
              {smartfinUploadResult && (
                <Button variant="outline" onClick={handleDownloadSmartfinResults}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Smartfin Results
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}