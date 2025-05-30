// lib/dbUtils.ts
// Helper utilities for working with the database

import db, { AnchorMaster, HierarchyMaster, HolidayMaster, PincodeBranch, RMBranch, MasterService } from './db';

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

// Map Hierarchy Master from UI to DB
export function mapHierarchyUIToDB(uiData: any): HierarchyMaster {
  return {
    id: uiData.empAdid || uiData.id || Date.now().toString(), // Fallback to ensure ID exists
    employeeName: uiData.fullName || uiData.employeeName || '',
    empAdid: uiData.empAdid || '',
    fullName: uiData.fullName || uiData.employeeName || '',
    rblAdid: uiData.rblAdid || '',
    rblName: uiData.rblName || '',
    region: uiData.region || '',
    zhAdid: uiData.zhAdid || '',
    zhName: uiData.zhName || '',
    yesEmail: uiData.yesEmail || '',
    mobile: uiData.mobile || ''
  };
}

// Map Holiday Master from UI to DB
export function mapHolidayUIToDB(uiData: any): HolidayMaster {
  return {
    id: uiData.id || Date.now().toString(), // Fallback to ensure ID exists
    date: uiData.date || '',
    Date: uiData.Date || uiData.date || '', // For backward compatibility
    name: uiData.name || '',
    type: uiData.type || '',
    HolidayType: uiData.HolidayType || uiData.type || '', // For backward compatibility
    description: uiData.description || ''
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
      rm_branch: await db.rm_branch.count()
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
  mapHolidayUIToDB
}; 