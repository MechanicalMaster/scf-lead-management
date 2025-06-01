// lib/dbUtils.ts
// Helper utilities for working with the database

import db, { AnchorMaster, HierarchyMaster, HolidayMaster, PincodeBranch, RMBranch, MasterService, ErrorCodeMaster } from './db';
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
    
    return { success: true };
  } catch (error: any) {
    console.error("Error initializing DB:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Count total records in each master store
 */
export async function getMasterDataCounts() {
  try {
    const counts = {
      anchor_master: await db.anchor_master.count(),
      hierarchy_master: await db.hierarchy_master.count(),
      holiday_master: await db.holiday_master.count(),
      pincode_branch: await db.pincode_branch.count(),
      rm_branch: await db.rm_branch.count(),
      error_codes: await db.error_codes.count(),
      processed_leads: await db.processed_leads.count()
    };
    return { success: true, data: counts };
  } catch (error: any) {
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
  mapErrorCodeUIToDB
}; 