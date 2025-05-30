// lib/db.ts
// MasterService: IndexedDB (Dexie.js) for Master Data Management
// Implements CRUD, Excel upload/download, and search for all master stores.
// Dependencies: dexie, xlsx, file-saver

import Dexie, { Table } from 'dexie';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- TypeScript interfaces for master data stores ---
export interface AnchorMaster {
  id: string;
  anchorname: string;
  programname: string;
  anchoruuid: string;
  programuuid: string;
  segment: string;
  PSMName: string;
  PSMADID: string;
  PSMEmail: string;
  UDF1: string;
  UDF2: string;
}

export interface HierarchyMaster {
  id: string;
  employeeName: string;
  empAdid: string;
  fullName: string;
  rblAdid: string;
  rblName: string;
  region: string;
  zhAdid: string;
  zhName: string;
  yesEmail: string;
  mobile: string;
}

export interface HolidayMaster {
  id: string;
  date: string;
  Date: string; // For backward compatibility
  name: string;
  type: string;
  HolidayType: string; // For backward compatibility
  description: string;
}

export interface PincodeBranch {
  id: string;
  pincode: string;
  branchCode: string;
  branchName: string;
  city: string;
  state: string;
  region: string;
  active: boolean;
}

export interface RMBranch {
  id: string;
  rmId: string;
  rmName: string;
  branchCode: string;
  branchName: string;
  region: string;
  role: string;
  active: boolean;
}

type StoreName = 'anchor_master' | 'hierarchy_master' | 'holiday_master' | 'pincode_branch' | 'rm_branch';

type StoreTableMap = {
  anchor_master: AnchorMaster;
  hierarchy_master: HierarchyMaster;
  holiday_master: HolidayMaster;
  pincode_branch: PincodeBranch;
  rm_branch: RMBranch;
};

// --- Dexie Database Setup ---
class SCFLeadManagementDB extends Dexie {
  anchor_master!: Table<AnchorMaster, string>;
  hierarchy_master!: Table<HierarchyMaster, string>;
  holiday_master!: Table<HolidayMaster, string>;
  pincode_branch!: Table<PincodeBranch, string>;
  rm_branch!: Table<RMBranch, string>;

  constructor() {
    super('SCFLeadManagement');
    this.version(1).stores({
      anchor_master: 'id, anchorname, programname',
      hierarchy_master: 'id, employeeName',
      holiday_master: 'id, Date, HolidayType',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state',
      rm_branch: 'id, rmId, rmName, branchCode, region',
    });
    
    // Version 2: Updated schema with additional indexed fields
    this.version(2).stores({
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
    });
  }
}

const db = new SCFLeadManagementDB();

// --- Utility: Store fields for Excel templates/validation ---
const STORE_FIELDS: Record<StoreName, string[]> = {
  anchor_master: ['id', 'anchorname', 'programname', 'anchoruuid', 'programuuid', 'segment', 'PSMName', 'PSMADID', 'PSMEmail', 'UDF1', 'UDF2'],
  hierarchy_master: ['id', 'employeeName', 'empAdid', 'fullName', 'rblAdid', 'rblName', 'region', 'zhAdid', 'zhName', 'yesEmail', 'mobile'],
  holiday_master: ['id', 'Date', 'HolidayType', 'date', 'name', 'type', 'description'],
  pincode_branch: ['id', 'pincode', 'branchCode', 'branchName', 'city', 'state', 'region', 'active'],
  rm_branch: ['id', 'rmId', 'rmName', 'branchCode', 'branchName', 'region', 'role', 'active'],
};

// --- MasterService Class ---
export class MasterService {
  // Add a single record
  static async createRecord<T extends StoreName>(storeName: T, record: StoreTableMap[T]) {
    try {
      await db[storeName].add(record);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get records with optional filters and sorting
  static async getRecords<T extends StoreName>(storeName: T, filters: Partial<StoreTableMap[T]> = {}, sortBy?: keyof StoreTableMap[T], limit = 20, offset = 0) {
    try {
      let collection = db[storeName].toCollection();
      for (const key in filters) {
        // @ts-ignore
        collection = collection.filter((item) => item[key] === filters[key]);
      }
      let results = await collection.toArray();
      if (sortBy) {
        results = results.sort((a: any, b: any) => (a[sortBy] > b[sortBy] ? 1 : -1));
      }
      return { success: true, data: results.slice(offset, offset + limit) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update a record by id
  static async updateRecord<T extends StoreName>(storeName: T, id: string, updates: Partial<StoreTableMap[T]>) {
    try {
      await db[storeName].update(id, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete a record by id
  static async deleteRecord<T extends StoreName>(storeName: T, id: string) {
    try {
      await db[storeName].delete(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Search records by indexed field
  static async searchRecords<T extends StoreName>(storeName: T, field: keyof StoreTableMap[T], value: any, limit = 20, offset = 0) {
    try {
      // @ts-ignore
      let collection = db[storeName].where(field).equals(value);
      const results = await collection.offset(offset).limit(limit).toArray();
      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Upload Excel: Parse, validate, and store records
  static async uploadExcel<T extends StoreName>(storeName: T, file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const expectedFields = STORE_FIELDS[storeName];
      const validRecords: StoreTableMap[T][] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        // Validate required fields
        const missing = expectedFields.filter((f) => !(f in row));
        if (missing.length) {
          errors.push(`Row ${i + 2}: Missing fields: ${missing.join(', ')}`);
          continue;
        }
        
        // Type conversions and field mappings
        if ('active' in row) {
          row.active = row.active === true || row.active === 'true' || row.active === 1 || row.active === '1';
        }
        
        // Handle field mappings for backward compatibility
        if (storeName === 'holiday_master') {
          // If new fields are present but old fields aren't, copy values
          if (row.date && !row.Date) row.Date = row.date;
          if (row.type && !row.HolidayType) row.HolidayType = row.type;
        }
        
        validRecords.push(row as StoreTableMap[T]);
      }
      
      // Chunked insert (100 at a time)
      for (let i = 0; i < validRecords.length; i += 100) {
        await db[storeName].bulkPut(validRecords.slice(i, i + 100));
      }
      
      return { success: errors.length === 0, errors };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Download Excel template for a store
  static downloadTemplate<T extends StoreName>(storeName: T) {
    const headers = STORE_FIELDS[storeName];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `${storeName}_template.xlsx`);
  }

  // Get unique anchor names from anchor_master
  static async getUniqueAnchorNames() {
    try {
      // Simplify implementation to avoid TypeScript issues
      const anchors = await db.anchor_master.toArray();
      const anchorNames: string[] = [];
      
      anchors.forEach(anchor => {
        if (anchor.anchorname && !anchorNames.includes(anchor.anchorname)) {
          anchorNames.push(anchor.anchorname);
        }
      });
      
      return { success: true, data: anchorNames };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get unique program names from anchor_master
  static async getUniqueProgramNames() {
    try {
      // Simplify implementation to avoid TypeScript issues
      const programs = await db.anchor_master.toArray();
      const programNames: string[] = [];
      
      programs.forEach(program => {
        if (program.programname && !programNames.includes(program.programname)) {
          programNames.push(program.programname);
        }
      });
      
      return { success: true, data: programNames };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Custom lead template download
  static downloadLeadTemplate() {
    const headers = [
      "Sr. No.",
      "Program Type",
      "Type of relationship",
      "Name of the Firm",
      "PAN Number",
      "Contact Person",
      "Mobile No.",
      "Email Address",
      "Address",
      "Pincode",
      "City",
      "RM ADID",
      "No. of months of relationship with Dealer",
      "Tenor (in days)",
      "Sales to Dealer (Actual)(in INR) 2020-21",
      "Sales to Dealer (Actual)(in INR) 2021-22",
      "Sales to Dealer (Actual)(in INR) 2022-23",
      "Projected Sales to Dealer (Projected)(in INR) 2023-24",
      "Dealer Turnover(in INR) 2022-23",
      "Limit Recommended (in INR)",
      "Dealer Payment Track Record",
      "Dealer overdue with anchor (No. of times in last 12 months)"
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `lead_upload_template.xlsx`);
  }
}

// --- Singleton Export ---
export default db;
