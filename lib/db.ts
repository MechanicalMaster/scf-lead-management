// lib/db.ts
// MasterService: IndexedDB (Dexie.js) for Master Data Management
// Implements CRUD, Excel upload/download, and search for all master stores.
// Dependencies: dexie, xlsx, file-saver

import Dexie, { Table } from 'dexie';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LEAD_TEMPLATE_HEADERS } from './constants';

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

export interface ErrorCodeMaster {
  id: string; // Typically same as errorCode
  errorCode: string; // PK for querying
  description: string;
  module: string; // e.g., 'Lead Upload', 'RM Assignment'
  severity: 'Error' | 'Warning' | 'Info';
}

export interface ProcessedLead {
  id: string; // Primary Key, e.g., `${uploadBatchId}-${originalRowNumber}`
  uploadBatchId: string; // To group leads from the same file
  processedTimestamp: string; // ISO string
  anchorNameSelected: string; // Anchor selected in UI
  programNameSelected: string; // Program selected in UI
  originalRowNumber: number;
  originalData: Record<string, any>; // All columns from uploaded Excel row
  assignedRmAdid: string | null;
  assignmentStatus: string;
  errorCode: string | null;
  errorDescription: string | null;
}

// Define the updated LeadCommunication interface separately to avoid type conflicts
export interface UpdatedLeadCommunication {
  id: string; // UUID for the communication
  processedLeadId: string; // Processed lead ID this communication is related to
  timestamp: string; // ISO date string
  communicationType: 
    'LeadAssignmentEmail' | 
    'RMReply' | 
    'SystemFollowUpEmail' | 
    'SystemReminderEmail' | 
    'PSMDecision_ReassignToRM' | 
    'PSMDecision_DropLead' | 
    'StageUpdate' | 
    'AISystemAssessment' | 
    'NoteAdded';
  title: string; // e.g., "Lead Uploaded Email", "RM Response"
  description: string; // Main body/details of the history item
  senderType: 'System' | 'RM' | 'PSM' | 'User';
  senderAdidOrEmail: string; // ADID for internal users, email for system/external
  recipientAdidOrEmail: string; // ADID or email of the primary recipient
  ccEmails?: string[]; // Array of emails for CC, if applicable
  aiSummary?: string; // AI-generated summary of RM replies or other content
  aiDecision?: string; // AI's suggested next step or assessment outcome
  aiTokensConsumed?: number; // Number of tokens consumed for this AI operation
  attachments?: { name: string; size: string; url?: string; type: string }[]; // Array of attachment objects
  relatedWorkflowStateId?: string; // Optional FK to LeadWorkflowState.id
}

// Keep the original LeadCommunication interface for backward compatibility
export interface LeadCommunication {
  id: string; // UUID for the communication
  leadId: string; // Processed lead ID this communication is related to
  rmEmail: string; // Email of the RM this communication is for/from
  messageType: 'assignment' | 'reply'; // Type of communication
  content: string; // Content of the message
  timestamp: string; // ISO date string
  sender: 'system' | 'rm'; // Who sent the message
  recipient: 'rm' | 'system'; // Who the message is for
  processedLeadId?: string; // Added for compatibility with new schema
  communicationType?: string; // Added for compatibility with new schema
  title?: string; // Added for compatibility with new schema
  description?: string; // Added for compatibility with new schema
  senderType?: string; // Added for compatibility with new schema
  senderAdidOrEmail?: string; // Added for compatibility with new schema
  recipientAdidOrEmail?: string; // Added for compatibility with new schema
  ccEmails?: string[]; // Added for compatibility with new schema
  aiSummary?: string; // Added for compatibility with new schema
  aiDecision?: string; // Added for compatibility with new schema
  aiTokensConsumed?: number; // Added for compatibility with new schema
  attachments?: { name: string; size: string; url?: string; type: string }[]; // Added for compatibility with new schema
  relatedWorkflowStateId?: string; // Added for compatibility with new schema
}

export interface LeadWorkflowState {
  id: string; // UUID PK
  processedLeadId: string; // FK to ProcessedLead
  currentStage: string; // e.g., 'RM_AwaitingReply', 'PSM_ReviewPending', 'Dropped'
  currentAssigneeType: 'RM' | 'PSM' | 'System';
  currentAssigneeAdid: string;
  psmAdid: string; // PSM for the anchor
  lastStageChangeTimestamp: string; // ISO string
  lastCommunicationTimestamp: string; // ISO string
  nextFollowUpTimestamp: string; // ISO string
  escalationLevel: number;
  droppedReason: string | null;
  updatedAt: string; // ISO string
  createdAt: string; // ISO string
}

type StoreName = 
  'anchor_master' | 
  'hierarchy_master' | 
  'holiday_master' | 
  'pincode_branch' | 
  'rm_branch' | 
  'error_codes' | 
  'processed_leads' | 
  'lead_communications' |
  'lead_workflow_states';

type StoreTableMap = {
  anchor_master: AnchorMaster;
  hierarchy_master: HierarchyMaster;
  holiday_master: HolidayMaster;
  pincode_branch: PincodeBranch;
  rm_branch: RMBranch;
  error_codes: ErrorCodeMaster;
  processed_leads: ProcessedLead;
  lead_communications: LeadCommunication;
  lead_workflow_states: LeadWorkflowState;
};

// --- Dexie Database Setup ---
export class SCFLeadManagementDB extends Dexie {
  anchor_master!: Table<AnchorMaster, string>;
  hierarchy_master!: Table<HierarchyMaster, string>;
  holiday_master!: Table<HolidayMaster, string>;
  pincode_branch!: Table<PincodeBranch, string>;
  rm_branch!: Table<RMBranch, string>;
  error_codes!: Table<ErrorCodeMaster, string>;
  processed_leads!: Table<ProcessedLead, string>;
  lead_communications!: Table<LeadCommunication, string>;
  lead_workflow_states!: Table<LeadWorkflowState, string>;

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

    // Version 3: Add error_codes and processed_leads tables
    this.version(3).stores({
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode'
    });

    // Version 4: Add lead_communications table
    this.version(4).stores({
      lead_communications: 'id, leadId, rmEmail, messageType, timestamp, sender, recipient',
      // Carry forward all table definitions from previous versions
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode'
    });
    
    // Version 5: Add lead_workflow_states and update lead_communications tables
    this.version(5).stores({
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail',
      // Carry forward all table definitions from previous versions
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode'
    });

    // Version 6: Add ai_prompts_master table and update lead_communications table
    this.version(6).stores({
      // Carry forward all table definitions from previous versions
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail',
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      ai_prompts_master: 'id, configName, serviceProvider, isActive'
    });
    
    // Version 7: Remove ai_prompts_master table
    this.version(7).stores({
      // Carry forward all table definitions from previous versions
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail',
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      ai_prompts_master: null // This line ensures the table is removed on upgrade
    });
  }
}

// Add minimal logging to avoid TypeScript errors
const db = new SCFLeadManagementDB();

// Log database schema version on object initialization
console.log(`Database schema version defined: ${db.verno}`);

// --- Utility: Store fields for Excel templates/validation ---
const STORE_FIELDS: Record<StoreName, string[]> = {
  anchor_master: ['id', 'anchorname', 'programname', 'anchoruuid', 'programuuid', 'segment', 'PSMName', 'PSMADID', 'PSMEmail', 'UDF1', 'UDF2'],
  hierarchy_master: ['id', 'employeeName', 'empAdid', 'fullName', 'rblAdid', 'rblName', 'region', 'zhAdid', 'zhName', 'yesEmail', 'mobile'],
  holiday_master: ['id', 'Date', 'HolidayType', 'date', 'name', 'type', 'description'],
  pincode_branch: ['id', 'pincode', 'branchCode', 'branchName', 'city', 'state', 'region', 'active'],
  rm_branch: ['id', 'rmId', 'rmName', 'branchCode', 'branchName', 'region', 'role', 'active'],
  error_codes: ['id', 'errorCode', 'description', 'module', 'severity'],
  processed_leads: [],  // No direct upload via master UI, populated programmatically
  lead_communications: ['id', 'leadId', 'rmEmail', 'messageType', 'content', 'timestamp', 'sender', 'recipient', 'processedLeadId', 'communicationType', 'title', 'description', 'senderType', 'senderAdidOrEmail', 'recipientAdidOrEmail', 'ccEmails', 'aiSummary', 'aiDecision', 'aiTokensConsumed', 'attachments', 'relatedWorkflowStateId'],
  lead_workflow_states: ['id', 'processedLeadId', 'currentStage', 'currentAssigneeType', 'currentAssigneeAdid', 'psmAdid', 'lastStageChangeTimestamp', 'lastCommunicationTimestamp', 'nextFollowUpTimestamp', 'escalationLevel', 'droppedReason', 'updatedAt', 'createdAt']
};

// --- MasterService Class ---
export class MasterService {
  // Add a single record
  static async createRecord<T extends StoreName>(storeName: T, record: Partial<StoreTableMap[T]>) {
    try {
      await db[storeName].add(record as any);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get total records count
  static async getTotalRecords<T extends StoreName>(storeName: T): Promise<{ success: boolean, count?: number, error?: string }> {
    try {
      const count = await db[storeName].count();
      return { success: true, count };
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
        
        // Ensure pincode is always a string in pincode_branch
        if (storeName === 'pincode_branch' && 'pincode' in row) {
          row.pincode = String(row.pincode);
        }
        
        // Ensure all ID and code fields are strings
        if ('id' in row) row.id = String(row.id);
        if ('branchCode' in row) row.branchCode = String(row.branchCode);
        if ('rmId' in row) row.rmId = String(row.rmId);
        
        // Handle field mappings for backward compatibility
        if (storeName === 'holiday_master') {
          // Format Excel dates to ISO format
          if (row.date) {
            if (typeof row.date === 'number' || !isNaN(Number(row.date))) {
              try {
                const excelDate = typeof row.date === 'number' ? row.date : Number(row.date);
                const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                row.date = jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
              } catch (e) {
                console.error("Error converting date:", e);
              }
            }
          }
          
          if (row.Date) {
            if (typeof row.Date === 'number' || !isNaN(Number(row.Date))) {
              try {
                const excelDate = typeof row.Date === 'number' ? row.Date : Number(row.Date);
                const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                row.Date = jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
              } catch (e) {
                console.error("Error converting Date:", e);
              }
            }
          }
          
          // If new fields are present but old fields aren't, copy values
          if (row.date && !row.Date) row.Date = row.date;
          if (row.type && !row.HolidayType) row.HolidayType = row.type;
        }
      }
      
      // Use the database's specific table method to avoid type issues
      if (storeName === 'anchor_master') {
        // Process 100 records at a time to avoid overwhelming the database
        for (let i = 0; i < json.length; i += 100) {
          await db.anchor_master.bulkPut(json.slice(i, i + 100));
        }
      } else if (storeName === 'hierarchy_master') {
        for (let i = 0; i < json.length; i += 100) {
          await db.hierarchy_master.bulkPut(json.slice(i, i + 100));
        }
      } else if (storeName === 'holiday_master') {
        for (let i = 0; i < json.length; i += 100) {
          await db.holiday_master.bulkPut(json.slice(i, i + 100));
        }
      } else if (storeName === 'pincode_branch') {
        for (let i = 0; i < json.length; i += 100) {
          await db.pincode_branch.bulkPut(json.slice(i, i + 100));
        }
      } else if (storeName === 'rm_branch') {
        for (let i = 0; i < json.length; i += 100) {
          await db.rm_branch.bulkPut(json.slice(i, i + 100));
        }
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
    const headers = LEAD_TEMPLATE_HEADERS;
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `lead_upload_template.xlsx`);
  }
}

export default db;