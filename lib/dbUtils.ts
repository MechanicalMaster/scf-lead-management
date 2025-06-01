// lib/dbUtils.ts
// Helper utilities for working with the database

import db, { AnchorMaster, HierarchyMaster, HolidayMaster, PincodeBranch, RMBranch, MasterService, ErrorCodeMaster, SmartfinStatusUpdate, EmailTemplateMaster } from './db';
import { ERROR_CODES } from './constants';

/**
 * Mapping functions to handle field compatibility between UI components and DB fields
 */

// Map Anchor Master from UI to DB
export function mapAnchorUIToDB(uiData: any): AnchorMaster {
  return {
    id: uiData.anchoruuid || uiData.id || Date.now().toString(), // Fallback to ensure ID exists
    anchorname: uiData.anchorname || '',
    programname: uiData.programname || '',
    anchoruuid: uiData.anchoruuid || uiData.id || '',
    programuuid: uiData.programuuid || '',
    segment: uiData.segment || '',
    PSMName: uiData.PSMName || '',
    PSMADID: uiData.PSMADID || '',
    PSMEmail: uiData.PSMEmail || '',
    UDF1: uiData.UDF1 || '',
    UDF2: uiData.UDF2 || ''
  };
}

// Map Hierarchy Master from UI to DB with all required fields
export function mapHierarchyUIToDB(uiData: any): HierarchyMaster {
  return {
    id: uiData.id || Date.now().toString(),
    
    // Required fields with fallbacks
    EmpNo: uiData.EmpNo || uiData['Emp No'] || uiData.empAdid || '',
    EmpADID: uiData.EmpADID || uiData['Emp ADID'] || uiData.empAdid || '',
    FullName: uiData.FullName || uiData['Full Name'] || uiData.fullName || uiData.employeeName || '',
    
    // Optional fields
    OldNo: uiData.OldNo || uiData['Old No'] || '',
    Gender: uiData.Gender || '',
    EmpStatus: uiData.EmpStatus || uiData['Emp Status'] || '',
    FunctionalDesignation: uiData.FunctionalDesignation || uiData['Functional Designation'] || '',
    Cat: uiData.Cat || '',
    Role: uiData.Role || '',
    Team: uiData.Team || '',
    CBLCode: uiData.CBLCode || uiData['CBL Code'] || '',
    CBLCodeADID: uiData.CBLCodeADID || uiData['CBL Code ADID'] || '',
    CBLName: uiData.CBLName || uiData['CBL Name'] || '',
    Cluster: uiData.Cluster || '',
    RBLCode: uiData.RBLCode || uiData['RBL Code'] || '',
    RBLADIDCode: uiData.RBLADIDCode || uiData['RBL ADID Code'] || uiData.rblAdid || '',
    RBLName: uiData.RBLName || uiData['RBL Name'] || uiData.rblName || '',
    Region: uiData.Region || uiData.region || '',
    ZHCode: uiData.ZHCode || uiData['ZH Code'] || '',
    ZHADID: uiData.ZHADID || uiData['ZH ADID'] || uiData.zhAdid || '',
    ZHName: uiData.ZHName || uiData['ZH Name'] || uiData.zhName || '',
    Zone: uiData.Zone || '',
    Vertical: uiData.Vertical || '',
    BranchCode: uiData.BranchCode || uiData['Branch Code'] || '',
    OfficeLocationCode: uiData.OfficeLocationCode || uiData['Office Location Code'] || '',
    Location: uiData.Location || '',
    City: uiData.City || '',
    State: uiData.State || '',
    DateOfJoining: uiData.DateOfJoining || uiData['Date Of Joining'] || '',
    YesEmail: uiData.YesEmail || uiData['Yes Email'] || uiData.yesEmail || '',
    Mobile: uiData.Mobile || uiData.mobile || '',
    ExitMonthResignDate: uiData.ExitMonthResignDate || uiData['Exit Month/Resign date'] || '',
    Remarks: uiData.Remarks || '',
    Segment: uiData.Segment || '',
    
    // Legacy fields for backward compatibility
    employeeName: uiData.employeeName || uiData.FullName || uiData['Full Name'] || '',
    empAdid: uiData.empAdid || uiData.EmpADID || uiData['Emp ADID'] || '',
    fullName: uiData.fullName || uiData.FullName || uiData['Full Name'] || '',
    rblAdid: uiData.rblAdid || uiData.RBLADIDCode || uiData['RBL ADID Code'] || '',
    rblName: uiData.rblName || uiData.RBLName || uiData['RBL Name'] || '',
    region: uiData.region || uiData.Region || '',
    zhAdid: uiData.zhAdid || uiData.ZHADID || uiData['ZH ADID'] || '',
    zhName: uiData.zhName || uiData.ZHName || uiData['ZH Name'] || '',
    yesEmail: uiData.yesEmail || uiData.YesEmail || uiData['Yes Email'] || '',
    mobile: uiData.mobile || uiData.Mobile || ''
  };
}

// Map Holiday Master from UI to DB
export function mapHolidayUIToDB(uiData: any): HolidayMaster {
  return {
    id: uiData.id || Date.now().toString(),
    Date: uiData.Date || uiData.date || '',
    date: uiData.date || uiData.Date || '',
    HolidayType: uiData.HolidayType || uiData.type || '',
    type: uiData.type || uiData.HolidayType || '',
    name: uiData.name || '',
    description: uiData.description || ''
  };
}

// Map Pincode Branch from UI to DB
export function mapPincodeBranchUIToDB(uiData: any): PincodeBranch {
  return {
    id: uiData.id || Date.now().toString(),
    
    // Map new fields
    Pincode: uiData.Pincode || uiData.pincode || '',
    BranchCode: uiData.BranchCode || uiData['Branch Code'] || uiData.branchCode || '',
    BranchName: uiData.BranchName || uiData['Branch Name'] || uiData.branchName || '',
    Cluster: uiData.Cluster || '',
    Region: uiData.Region || uiData.region || '',
    
    // Legacy fields for backward compatibility
    pincode: uiData.pincode || uiData.Pincode || '',
    branchCode: uiData.branchCode || uiData.BranchCode || uiData['Branch Code'] || '',
    branchName: uiData.branchName || uiData.BranchName || uiData['Branch Name'] || '',
    region: uiData.region || uiData.Region || '',
    city: uiData.city || uiData.City || '',
    state: uiData.state || uiData.State || '',
    active: uiData.active !== undefined ? uiData.active : true
  };
}

// Map RM Branch from UI to DB - Fix linter errors by adding missing fields to mapRMBranchUIToDB 
export function mapRMBranchUIToDB(uiData: any): RMBranch {
  return {
    id: uiData.id || Date.now().toString(),
    rmId: uiData.rmId || '',
    rmName: uiData.rmName || '',
    branchCode: uiData.branchCode || '',
    branchName: uiData.branchName || '',
    region: uiData.region || '',
    role: uiData.role || '',
    active: uiData.active !== undefined ? uiData.active : true
  };
}

// Map ErrorCode from UI to DB - Fix linter errors by adding missing fields to mapErrorCodeUIToDB
export function mapErrorCodeUIToDB(uiData: any): ErrorCodeMaster {
  return {
    id: uiData.id || uiData.errorCode || Date.now().toString(),
    errorCode: uiData.errorCode || '',
    description: uiData.description || '',
    module: uiData.module || '',
    severity: uiData.severity || 'Error'
  };
}

// Map Smartfin Status Update from UI/Excel to DB
export function mapSmartfinStatusUpdateUIToDB(uiData: any): SmartfinStatusUpdate {
  // Helper function to convert Excel date formats if needed
  const parseDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    // If it's a number (Excel date format), convert it
    if (typeof dateValue === 'number') {
      try {
        // Excel dates are number of days since Dec 30, 1899
        const excelDate = dateValue;
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } catch (e) {
        console.error("Error converting Excel date:", e);
        return String(dateValue);
      }
    }
    
    // If it's already a string, return as is
    return String(dateValue);
  };

  return {
    applicationNo: String(uiData["Application No"] || ''),
    createdDate: parseDate(uiData["Created Date"]),
    firmName: String(uiData["Firm Name"] || ''),
    applicationType: String(uiData["Application Type"] || ''),
    status: String(uiData["Status"] || ''),
    branch: String(uiData["Branch"] || ''),
    requestedAmount: String(uiData["Requested Amount"] || ''),
    sanctionedAmount: String(uiData["Sanctioned Amount"] || ''),
    sanctionDate: parseDate(uiData["Sanction Date"]),
    programMappedDate: parseDate(uiData["Program Mapped Date"]),
    rmName: String(uiData["RM Name"] || ''),
    rmTAT: String(uiData["RM TAT"] || ''),
    cpaName: String(uiData["CPA Name"] || ''),
    cpaTAT: String(uiData["CPA TAT"] || ''),
    cmName: String(uiData["CM Name"] || ''),
    cmTAT: String(uiData["CM TAT"] || ''),
    approvalRequestedDate: parseDate(uiData["Approval Requested Date"]),
    approvalTAT: String(uiData["Approval TAT"] || ''),
    totalTAT: String(uiData["Total TAT"] || ''),
    uploadTimestamp: new Date().toISOString()
  };
}

// Map Email Template from UI/Excel to DB
export function mapEmailTemplateUIToDB(uiData: any): EmailTemplateMaster {
  // Parse string arrays for recipients
  const parseRecipients = (recipients: string): string[] => {
    if (!recipients) return [];
    // Handle both comma-separated strings and already parsed arrays
    if (Array.isArray(recipients)) return recipients;
    
    return recipients.split(',').map(item => item.trim()).filter(Boolean);
  };

  const now = new Date().toISOString();
  
  return {
    id: uiData.id || Date.now().toString(),
    templateName: String(uiData["Template Name"] || ''),
    description: String(uiData["Description"] || ''),
    subject: String(uiData["Subject"] || ''),
    body: String(uiData["Body"] || ''),
    toRecipients: parseRecipients(uiData["To Recipients"]),
    ccRecipients: parseRecipients(uiData["CC Recipients"]),
    category: String(uiData["Category"] || ''),
    isActive: uiData["Is Active"] === true || uiData["Is Active"] === "true" || uiData["Is Active"] === "Yes" || uiData["Is Active"] === "yes" || uiData["Is Active"] === 1,
    createdAt: uiData.createdAt || now,
    updatedAt: uiData.updatedAt || now
  };
}

/**
 * Initialize the database with sample data if it's empty
 */
export async function initializeDBIfEmpty() {
  try {
    // Check if anchor_master is empty
    const anchorsCount = await db.anchor_master.count();
    if (anchorsCount === 0) {
      // Sample Anchor Master data
      const sampleAnchors: AnchorMaster[] = [
        {
          id: "anc-001",
          anchorname: "ABC Corp",
          programname: "Supply Chain Finance",
          anchoruuid: "anc-001",
          programuuid: "prog-001",
          segment: "Large Corporate",
          PSMName: "John Doe",
          PSMADID: "ADID001",
          PSMEmail: "john.doe@example.com",
          UDF1: "Custom1",
          UDF2: "Custom2"
        },
        {
          id: "anc-002",
          anchorname: "XYZ Industries",
          programname: "Dealer Finance",
          anchoruuid: "anc-002",
          programuuid: "prog-002",
          segment: "Mid-size",
          PSMName: "Jane Smith",
          PSMADID: "ADID002",
          PSMEmail: "jane.smith@example.com",
          UDF1: "Custom3",
          UDF2: "Custom4"
        }
      ];
      
      // Insert sample anchors
      await db.anchor_master.bulkAdd(sampleAnchors);
      console.log("Initialized sample anchor data");
    }
    
    // Check if hierarchy_master is empty
    const hierarchyCount = await db.hierarchy_master.count();
    if (hierarchyCount === 0) {
      // Sample Hierarchy Master data
      const sampleHierarchy: HierarchyMaster[] = [
        {
          id: "EMP001",
          // New required fields
          EmpNo: "EMP001",
          EmpADID: "EMP001",
          FullName: "Vikram Mehta",
          // Optional new fields
          Role: "RM",
          Team: "Sales",
          Region: "North",
          Zone: "North Zone",
          RBLCode: "RBL001",
          RBLADIDCode: "RBL001",
          RBLName: "RBL Name 1",
          ZHADID: "ZH001",
          ZHName: "ZH Name 1",
          YesEmail: "vikram.mehta@example.com",
          Mobile: "9876543210",
          // Legacy fields
          employeeName: "Vikram Mehta",
          empAdid: "EMP001",
          fullName: "Vikram Mehta",
          rblAdid: "RBL001",
          rblName: "RBL Name 1",
          region: "North",
          zhAdid: "ZH001",
          zhName: "ZH Name 1",
          yesEmail: "vikram.mehta@example.com",
          mobile: "9876543210"
        },
        {
          id: "EMP002",
          // New required fields
          EmpNo: "EMP002",
          EmpADID: "EMP002",
          FullName: "Neha Gupta",
          // Optional new fields
          Role: "RM",
          Team: "Support",
          Region: "West",
          Zone: "West Zone",
          RBLCode: "RBL002",
          RBLADIDCode: "RBL002",
          RBLName: "RBL Name 2",
          ZHADID: "ZH002",
          ZHName: "ZH Name 2",
          YesEmail: "neha.gupta@example.com",
          Mobile: "9123456780",
          // Legacy fields
          employeeName: "Neha Gupta",
          empAdid: "EMP002",
          fullName: "Neha Gupta",
          rblAdid: "RBL002",
          rblName: "RBL Name 2",
          region: "West",
          zhAdid: "ZH002",
          zhName: "ZH Name 2",
          yesEmail: "neha.gupta@example.com",
          mobile: "9123456780"
        }
      ];
      
      // Insert sample hierarchy
      await db.hierarchy_master.bulkAdd(sampleHierarchy);
      console.log("Initialized sample hierarchy data");
    }
    
    // Check if holiday_master is empty
    const holidaysCount = await db.holiday_master.count();
    if (holidaysCount === 0) {
      // Sample Holiday Master data
      const sampleHolidays: HolidayMaster[] = [
        {
          id: "hol-001",
          date: "2025-01-01",
          Date: "2025-01-01",
          name: "New Year's Day",
          type: "National",
          HolidayType: "National",
          description: "New Year's Day celebration"
        },
        {
          id: "hol-002",
          date: "2025-01-26",
          Date: "2025-01-26",
          name: "Republic Day",
          type: "National",
          HolidayType: "National",
          description: "National Republic Day"
        }
      ];
      
      // Insert sample holidays
      await db.holiday_master.bulkAdd(sampleHolidays);
      console.log("Initialized sample holiday data");
    }
    
    // Check if error_codes is empty
    const errorCodesCount = await db.error_codes.count();
    if (errorCodesCount === 0) {
      // Initialize error codes from constants
      const errorCodesList: ErrorCodeMaster[] = Object.values(ERROR_CODES).map(ec => ({
        id: ec.code,
        errorCode: ec.code,
        description: ec.description,
        module: ec.module,
        severity: ec.severity as 'Error' | 'Warning' | 'Info'
      }));
      
      // Insert error codes
      await db.error_codes.bulkAdd(errorCodesList);
      console.log("Initialized error codes data");
    }
    
    // Check if pincode_branch is empty
    const pincodeCount = await db.pincode_branch.count();
    if (pincodeCount === 0) {
      // Sample Pincode Branch data
      const samplePincodeBranches: PincodeBranch[] = [
        {
          id: "pin-001",
          // New fields
          Pincode: "400001",
          BranchCode: "BRANCH001",
          BranchName: "Mumbai Main",
          Cluster: "Mumbai Metropolitan",
          Region: "West",
          // Legacy fields
          pincode: "400001",
          branchCode: "BRANCH001",
          branchName: "Mumbai Main",
          city: "Mumbai",
          state: "Maharashtra",
          region: "West",
          active: true
        },
        {
          id: "pin-002",
          // New fields
          Pincode: "110001",
          BranchCode: "BRANCH002",
          BranchName: "Delhi Central",
          Cluster: "Delhi NCR",
          Region: "North",
          // Legacy fields
          pincode: "110001",
          branchCode: "BRANCH002",
          branchName: "Delhi Central",
          city: "New Delhi",
          state: "Delhi",
          region: "North",
          active: true
        }
      ];
      
      // Insert sample pincode branches
      await db.pincode_branch.bulkAdd(samplePincodeBranches);
      console.log("Initialized sample pincode branch data");
    }
    
    // Check if email_template_master is empty
    const emailTemplatesCount = await db.email_template_master.count();
    if (emailTemplatesCount === 0) {
      // Sample Email Template Master data
      const sampleEmailTemplates: EmailTemplateMaster[] = [
        {
          id: "template-001",
          templateName: "Lead Assignment Email",
          description: "Email sent to RM when a new lead is assigned.",
          subject: "New Lead Assigned: {{Lead.DealerName}} - {{Lead.AnchorName}}",
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear {{RMName}},</p>
  
  <p>A new lead has been assigned to you from the SCF Lead Management System:</p>
  
  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background-color: #f9f9f9; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #333;">Lead Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0; font-weight: bold; width: 40%;">Dealer/Firm Name:</td>
        <td style="padding: 5px 0;">{{Lead.DealerName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Anchor Name:</td>
        <td style="padding: 5px 0;">{{Lead.AnchorName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Program:</td>
        <td style="padding: 5px 0;">{{Lead.ProgramName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Contact Person:</td>
        <td style="padding: 5px 0;">{{Lead.ContactPerson}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Contact Mobile:</td>
        <td style="padding: 5px 0;">{{Lead.ContactMobile}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Contact Email:</td>
        <td style="padding: 5px 0;">{{Lead.ContactEmail}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Address:</td>
        <td style="padding: 5px 0;">{{Lead.Address}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">City:</td>
        <td style="padding: 5px 0;">{{Lead.City}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Pincode:</td>
        <td style="padding: 5px 0;">{{Lead.Pincode}}</td>
      </tr>
    </table>
  </div>
  
  <p>Please review this lead and take appropriate action within <strong>48 hours</strong>. Your timely response is crucial for maintaining our service standards.</p>
  
  <p>To respond to this lead, please log in to the <a href="{{SystemURL}}" style="color: #0066cc; text-decoration: none;">SCF Lead Management System</a> and update the lead status.</p>
  
  <p>Thank you for your prompt attention to this matter.</p>
  
  <p>Best regards,<br>SCF Lead Management System</p>
  
  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>Date: {{CurrentDate}}</p>
  </div>
</div>`,
          toRecipients: ["{{Lead.RMEmail}}"],
          ccRecipients: ["{{Lead.CBLEmail}}", "{{Lead.RBLEmail}}"],
          category: "Assignment",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "template-002",
          templateName: "Lead Reminder Email",
          description: "Reminder email for pending action on a lead.",
          subject: "REMINDER: Action Required on Lead {{Lead.ID}} - {{Lead.DealerName}}",
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear {{RMName}},</p>
  
  <p style="color: #d32f2f; font-weight: bold;">This is a reminder that you have a lead that requires your attention.</p>
  
  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background-color: #f9f9f9; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #d32f2f;">Lead Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0; font-weight: bold; width: 40%;">Lead ID:</td>
        <td style="padding: 5px 0;">{{Lead.ID}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Dealer/Firm Name:</td>
        <td style="padding: 5px 0;">{{Lead.DealerName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Anchor Name:</td>
        <td style="padding: 5px 0;">{{Lead.AnchorName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Program:</td>
        <td style="padding: 5px 0;">{{Lead.ProgramName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold; color: #d32f2f;">Days Since Assignment:</td>
        <td style="padding: 5px 0; color: #d32f2f;">{{Lead.DaysSinceAssignment}}</td>
      </tr>
    </table>
  </div>
  
  <p>Please take immediate action on this lead. Failure to respond within <strong>24 hours</strong> will result in escalation to your supervisor.</p>
  
  <p>To respond to this lead, please log in to the <a href="{{SystemURL}}" style="color: #0066cc; text-decoration: none;">SCF Lead Management System</a> and update the lead status.</p>
  
  <p>Thank you for your prompt attention to this matter.</p>
  
  <p>Best regards,<br>SCF Lead Management System</p>
  
  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>Date: {{CurrentDate}}</p>
  </div>
</div>`,
          toRecipients: ["{{Lead.RMEmail}}"],
          ccRecipients: ["{{Lead.CBLEmail}}"],
          category: "Reminder",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "template-003",
          templateName: "Lead Escalation Summary (CBL/RBL)",
          description: "Summary of escalated leads for CBLs/RBLs regarding RMs under them.",
          subject: "Lead Escalation Summary - RMs Requiring Action - {{CurrentDate}}",
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear {{ManagerName}},</p>
  
  <p>Please find below a summary of escalated leads for RMs under your supervision for the period: <strong>{{ReportingPeriod}}</strong></p>
  
  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background-color: #f9f9f9; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #333;">Escalation Summary</h3>
    
    <!-- This section would be repeated for each RM with escalated leads -->
    <div style="margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">
      <h4 style="margin: 0 0 10px 0; color: #d32f2f;">RM: {{RMName_1}}</h4>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Lead ID</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Dealer Name</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Anchor</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{{Lead_1_ID}}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{{Lead_1_DealerName}}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{{Lead_1_AnchorName}}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd; color: #d32f2f;">{{Lead_1_DaysOverdue}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <p style="font-weight: bold;">Total Escalated Leads: {{TotalEscalatedLeads}}</p>
  </div>
  
  <p>Please ensure these leads are addressed promptly. Your intervention may be required to ensure timely responses from the RMs.</p>
  
  <p>For detailed information, please log in to the <a href="{{SystemURL}}" style="color: #0066cc; text-decoration: none;">SCF Lead Management System</a>.</p>
  
  <p>Thank you for your attention to this matter.</p>
  
  <p>Best regards,<br>SCF Lead Management System</p>
  
  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>Date: {{CurrentDate}}</p>
  </div>
</div>`,
          toRecipients: ["{{ManagerEmail}}"],
          ccRecipients: [],
          category: "Escalation",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "template-004",
          templateName: "ZH Escalation Summary Email",
          description: "Summary of escalated leads for Zonal Heads.",
          subject: "Zonal Lead Escalation Summary - {{CurrentDate}}",
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear {{ZHName}},</p>
  
  <p>Please find below a summary of escalated leads across your zone for the period: <strong>{{ReportingPeriod}}</strong></p>
  
  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background-color: #f9f9f9; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #333;">Zone Escalation Summary</h3>
    
    <!-- This section would be repeated for each RBL/CBL with escalated leads -->
    <div style="margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">
      <h4 style="margin: 0 0 10px 0; color: #d32f2f;">Manager: {{RBLName_1}}</h4>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">RM Name</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Overdue Leads</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Most Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{{RM_1_Name}}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{{RM_1_OverdueLeadsCount}}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd; color: #d32f2f;">{{RM_1_MaxDaysOverdue}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <p style="font-weight: bold;">Total Managers with Escalations: {{TotalManagersWithEscalations}}</p>
    <p style="font-weight: bold;">Total RMs with Escalations: {{TotalRMsWithEscalations}}</p>
    <p style="font-weight: bold;">Total Escalated Leads: {{TotalEscalatedLeads}}</p>
  </div>
  
  <p>Please ensure your regional and cluster managers are addressing these escalated leads promptly.</p>
  
  <p>For detailed information, please log in to the <a href="{{SystemURL}}" style="color: #0066cc; text-decoration: none;">SCF Lead Management System</a>.</p>
  
  <p>Thank you for your attention to this matter.</p>
  
  <p>Best regards,<br>SCF Lead Management System</p>
  
  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>Date: {{CurrentDate}}</p>
  </div>
</div>`,
          toRecipients: ["{{ZHEmail}}"],
          ccRecipients: [],
          category: "Escalation",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "template-005",
          templateName: "PSM Lead Reassignment to RM",
          description: "Email sent to RM when PSM reassigns/sends back a lead.",
          subject: "Lead {{Lead.ID}} Reassigned by PSM: {{Lead.DealerName}}",
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear {{RMName}},</p>
  
  <p><strong>{{PSMName}}</strong> has reassigned a lead back to you that requires your attention.</p>
  
  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; background-color: #f9f9f9; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #333;">Lead Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0; font-weight: bold; width: 40%;">Lead ID:</td>
        <td style="padding: 5px 0;">{{Lead.ID}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Dealer/Firm Name:</td>
        <td style="padding: 5px 0;">{{Lead.DealerName}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Anchor Name:</td>
        <td style="padding: 5px 0;">{{Lead.AnchorName}}</td>
      </tr>
    </table>
    
    <div style="margin-top: 15px; padding: 10px; border-left: 4px solid #3f51b5; background-color: #e8eaf6;">
      <h4 style="margin-top: 0; color: #3f51b5;">Notes from PSM:</h4>
      <p style="margin-bottom: 0;">{{PSMNotes}}</p>
    </div>
  </div>
  
  <p>Please review this lead and take appropriate action as requested by the PSM. Your prompt attention is appreciated.</p>
  
  <p>To respond to this lead, please log in to the <a href="{{SystemURL}}" style="color: #0066cc; text-decoration: none;">SCF Lead Management System</a> and update the lead status.</p>
  
  <p>Thank you for your prompt attention to this matter.</p>
  
  <p>Best regards,<br>SCF Lead Management System</p>
  
  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>Date: {{CurrentDate}}</p>
  </div>
</div>`,
          toRecipients: ["{{Lead.RMEmail}}"],
          ccRecipients: ["{{Lead.PSMEmail}}"],
          category: "PSM Action",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "template-006",
          templateName: "Daily Lead Management Summary",
          description: "Daily summary of platform actions for senior stakeholders.",
          subject: "Daily SCF Lead Management Summary - {{CurrentDate}}",
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
    <h2 style="margin: 0;">Daily SCF Lead Management Summary</h2>
    <p style="margin: 5px 0 0 0;">{{CurrentDate}}</p>
  </div>
  
  <div style="padding: 20px;">
    <p>Dear Stakeholders,</p>
    
    <p>Please find below a summary of today's activities in the SCF Lead Management System:</p>
    
    <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; margin: 15px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd; width: 60%;">New Leads Added Today</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #2e7d32;">{{NewLeadsToday}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Leads Processed by RMs Today</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #1976d2;">{{LeadsProcessedToday}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Pending Escalations</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #d32f2f;">{{PendingEscalations}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Leads Closed Today</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #2e7d32;">{{ClosedLeadsToday}}</td>
        </tr>
      </table>
    </div>
    
    <p>For detailed information, please log in to the <a href="{{SystemURL}}" style="color: #0066cc; text-decoration: none;">SCF Lead Management System</a>.</p>
    
    <p>Thank you for your continued support.</p>
    
    <p>Best regards,<br>SCF Lead Management System</p>
  </div>
  
  <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; color: #777; text-align: center;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>If you no longer wish to receive these daily summaries, please contact the system administrator.</p>
  </div>
</div>`,
          toRecipients: ["{{StakeholderEmailList}}"],
          ccRecipients: [],
          category: "Summary Report",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "template-007",
          templateName: "Weekly Lead Management Summary",
          description: "Weekly summary of platform actions for senior stakeholders.",
          subject: "Weekly SCF Lead Management Summary - Week of {{WeekStartDate}}",
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #303f9f; color: white; padding: 20px; text-align: center;">
    <h2 style="margin: 0;">Weekly SCF Lead Management Summary</h2>
    <p style="margin: 5px 0 0 0;">Week of {{WeekStartDate}} to {{WeekEndDate}}</p>
  </div>
  
  <div style="padding: 20px;">
    <p>Dear Stakeholders,</p>
    
    <p>Please find below a summary of this week's activities in the SCF Lead Management System:</p>
    
    <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; margin: 15px 0;">
      <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Weekly Metrics</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd; width: 60%;">Total New Leads This Week</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #2e7d32;">{{TotalNewLeadsWeekly}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Total Leads Processed This Week</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #1976d2;">{{TotalProcessedLeadsWeekly}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Lead Conversion Rate</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #00695c;">{{ConversionRateWeekly}}%</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Average Lead Age (Days)</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #d32f2f;">{{AverageLeadAgeWeekly}}</td>
        </tr>
      </table>
      
      <h3 style="margin-top: 20px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Top Performing RMs This Week</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">RM Name</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Leads Processed</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Conversion Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{{TopRM_1_Name}}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">{{TopRM_1_LeadsProcessed}}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">{{TopRM_1_ConversionRate}}%</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <p>For detailed information and comprehensive reports, please log in to the <a href="{{SystemURL}}" style="color: #0066cc; text-decoration: none;">SCF Lead Management System</a>.</p>
    
    <p>Thank you for your continued support.</p>
    
    <p>Best regards,<br>SCF Lead Management System</p>
  </div>
  
  <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; color: #777; text-align: center;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>If you no longer wish to receive these weekly summaries, please contact the system administrator.</p>
  </div>
</div>`,
          toRecipients: ["{{StakeholderEmailList}}"],
          ccRecipients: [],
          category: "Summary Report",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Insert sample email templates
      await db.email_template_master.bulkAdd(sampleEmailTemplates);
      console.log("Initialized sample email template data");
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error initializing DB:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get counts of records in each master data table
 */
export async function getMasterDataCounts() {
  try {
    const [
      anchorsCount,
      hierarchyCount,
      holidaysCount,
      pincodeBranchCount,
      rmBranchCount,
      errorCodesCount,
      smartfinStatusCount,
      emailTemplateCount
    ] = await Promise.all([
      db.anchor_master.count(),
      db.hierarchy_master.count(),
      db.holiday_master.count(),
      db.pincode_branch.count(),
      db.rm_branch.count(),
      db.error_codes.count(),
      db.smartfin_status_updates.count(),
      db.email_template_master.count()
    ]);
    
    const counts = {
      anchor_master: anchorsCount,
      hierarchy_master: hierarchyCount,
      holiday_master: holidaysCount,
      pincode_branch: pincodeBranchCount,
      rm_branch: rmBranchCount,
      error_codes: errorCodesCount,
      smartfin_status_updates: smartfinStatusCount,
      email_template_master: emailTemplateCount
    };
    
    return { success: true, data: counts };
  } catch (error: any) {
    console.error("Error getting master data counts:", error);
    return { success: false, error: error.message };
  }
}

export default {
  initializeDBIfEmpty,
  getMasterDataCounts,
  mapAnchorUIToDB,
  mapHierarchyUIToDB,
  mapHolidayUIToDB,
  mapPincodeBranchUIToDB,
  mapRMBranchUIToDB,
  mapErrorCodeUIToDB,
  mapSmartfinStatusUpdateUIToDB,
  mapEmailTemplateUIToDB
}; 