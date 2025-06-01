// lib/db.ts
// MasterService: IndexedDB (Dexie.js) for Master Data Management
// Implements CRUD, Excel upload/download, and search for all master stores.
// Dependencies: dexie, xlsx, file-saver

import Dexie, { Table } from 'dexie';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LEAD_TEMPLATE_HEADERS, SMARTFIN_UPDATE_TEMPLATE_HEADERS, EMAIL_TEMPLATE_MASTER_HEADERS } from './constants';
import { mapAnchorUIToDB, mapHierarchyUIToDB, mapHolidayUIToDB, mapPincodeBranchUIToDB, mapRMBranchUIToDB, mapErrorCodeUIToDB, mapSmartfinStatusUpdateUIToDB, mapEmailTemplateUIToDB } from './dbUtils';

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
  OldNo?: string;
  EmpNo: string;
  EmpADID: string;
  FullName: string;
  Gender?: string;
  EmpStatus?: string;
  FunctionalDesignation?: string;
  Cat?: string;
  Role?: string;
  Team?: string;
  CBLCode?: string;
  CBLCodeADID?: string;
  CBLName?: string;
  Cluster?: string;
  RBLCode?: string;
  RBLADIDCode?: string;
  RBLName?: string;
  Region?: string;
  ZHCode?: string;
  ZHADID?: string;
  ZHName?: string;
  Zone?: string;
  Vertical?: string;
  BranchCode?: string;
  OfficeLocationCode?: string;
  Location?: string;
  City?: string;
  State?: string;
  DateOfJoining?: string;
  YesEmail?: string;
  Mobile?: string;
  ExitMonthResignDate?: string;
  Remarks?: string;
  Segment?: string;
  
  // Legacy fields for backwards compatibility
  employeeName?: string;
  empAdid?: string;
  fullName?: string;
  rblAdid?: string;
  rblName?: string;
  region?: string;
  zhAdid?: string;
  zhName?: string;
  yesEmail?: string;
  mobile?: string;
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
  Pincode: string;
  BranchCode: string;
  BranchName: string;
  Cluster: string;
  Region: string;
  
  // Legacy fields for backwards compatibility
  pincode?: string;
  branchCode?: string;
  branchName?: string;
  city?: string;
  state?: string;
  region?: string;
  active?: boolean;
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
  smartfinUploadStatus?: 'pending' | 'success' | 'failed' | null;
  smartfinDealerId?: string | null;
  smartfinErrorCode?: string | null;
  smartfinErrorDescription?: string | null;
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

export interface SmartfinStatusUpdate {
  applicationNo: string; // Primary Key
  createdDate: string;
  firmName: string;
  applicationType: string;
  status: string;
  branch: string;
  requestedAmount: string;
  sanctionedAmount: string;
  sanctionDate: string;
  programMappedDate: string;
  rmName: string;
  rmTAT: string;
  cpaName: string;
  cpaTAT: string;
  cmName: string;
  cmTAT: string;
  approvalRequestedDate: string;
  approvalTAT: string;
  totalTAT: string;
  uploadTimestamp?: string; // When the record was uploaded
}

export interface EmailTemplateMaster {
  id: string; // Primary Key, e.g., UUID
  templateName: string; // e.g., "Lead Assignment Email"
  description?: string; // Brief explanation of the template's purpose
  subject: string; // Email subject line
  body: string; // Email content, can be plain text or HTML
  toRecipients: string[]; // Array of roles/placeholders, e.g., ["RM"], ["{{Lead.RMEmail}}"]
  ccRecipients: string[]; // Array of roles/placeholders, e.g., ["CBL", "RBL"]
  category?: string; // e.g., "Assignment", "Escalation", "Notification"
  isActive: boolean; // Default to true
  createdAt: string; // ISO string, for tracking when it was added
  updatedAt: string; // ISO string, for tracking updates
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
  'lead_workflow_states' |
  'smartfin_status_updates' |
  'email_template_master';

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
  smartfin_status_updates: SmartfinStatusUpdate;
  email_template_master: EmailTemplateMaster;
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
  smartfin_status_updates!: Table<SmartfinStatusUpdate, string>;
  email_template_master!: Table<EmailTemplateMaster, string>;

  constructor() {
    super('SCFLeadManagement');
    
    // Version 1 schema
    this.version(1).stores({
      anchor_master: 'id, anchorname, programname',
      hierarchy_master: 'id, employeeName',
      holiday_master: 'id, Date, HolidayType',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state',
      rm_branch: 'id, rmId, rmName, branchCode, region',
    });
    
    // Version 2 adds error_codes, processed_leads, lead_communications, lead_workflow_states
    // and updates processed_leads with the smartfin fields
    this.version(2).stores({
      anchor_master: 'id, anchorname, programname',
      hierarchy_master: 'id, employeeName',
      holiday_master: 'id, Date, HolidayType',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state',
      rm_branch: 'id, rmId, rmName, branchCode, region',
      error_codes: 'id, errorCode, module',
      processed_leads: 'id, uploadBatchId, assignedRmAdid, assignmentStatus, smartfinUploadStatus',
      lead_communications: 'id, processedLeadId, communicationType, timestamp',
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, psmAdid'
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
      ai_prompts_master: 'id, name, category, prompt, systemPrompt, modelType',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail, aiTokensConsumed',
      // Carry forward all table definitions from previous versions
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode'
    });
    
    // Version 7: Update lead_workflow_states to include psmAdid in the index
    this.version(7).stores({
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, psmAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      ai_prompts_master: 'id, name, category, prompt, systemPrompt, modelType',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail, aiTokensConsumed',
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode'
    });

    // Version 8: Update PincodeBranch and HierarchyMaster schemas with new fields
    this.version(8).stores({
      pincode_branch: 'id, Pincode, BranchCode, BranchName, Cluster, Region',
      hierarchy_master: 'id, EmpADID, FullName, Role, Team, Region, Zone',
      
      // Carry forward all other table definitions
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, psmAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      ai_prompts_master: 'id, name, category, prompt, systemPrompt, modelType',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail, aiTokensConsumed',
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode'
    });

    // Version 8: Add upgrade function to migrate old data
    this.version(8).upgrade(async tx => {
      console.log('Running database upgrade to version 8...');
      
      // Migrate PincodeBranch records
      try {
        const pincodeBranches = await tx.table('pincode_branch').toArray();
        console.log(`Migrating ${pincodeBranches.length} pincode branch records...`);
        
        for (const pb of pincodeBranches) {
          const updates: Partial<PincodeBranch> = {};
          
          // Map old fields to new fields if new fields don't exist
          if (pb.pincode && !pb.Pincode) updates.Pincode = pb.pincode;
          if (pb.branchCode && !pb.BranchCode) updates.BranchCode = pb.branchCode;
          if (pb.branchName && !pb.BranchName) updates.BranchName = pb.branchName;
          if (pb.region && !pb.Region) updates.Region = pb.region;
          
          // Set Cluster if it doesn't exist
          if (!pb.Cluster) updates.Cluster = pb.region || 'Default'; // Use region as default cluster if available
          
          // Only update if we have changes
          if (Object.keys(updates).length > 0) {
            await tx.table('pincode_branch').update(pb.id, updates);
          }
        }
        
        console.log('Pincode branch migration completed');
      } catch (error) {
        console.error('Error migrating pincode branches:', error);
      }
      
      // Migrate HierarchyMaster records
      try {
        const hierarchyRecords = await tx.table('hierarchy_master').toArray();
        console.log(`Migrating ${hierarchyRecords.length} hierarchy records...`);
        
        for (const hr of hierarchyRecords) {
          const updates: Partial<HierarchyMaster> = {};
          
          // Map old fields to new fields if new fields don't exist
          if (hr.empAdid && !hr.EmpADID) updates.EmpADID = hr.empAdid;
          if ((hr.fullName || hr.employeeName) && !hr.FullName) {
            updates.FullName = hr.fullName || hr.employeeName || '';
          }
          if (hr.rblAdid && !hr.RBLADIDCode) updates.RBLADIDCode = hr.rblAdid;
          if (hr.rblName && !hr.RBLName) updates.RBLName = hr.rblName;
          if (hr.region && !hr.Region) updates.Region = hr.region;
          if (hr.zhAdid && !hr.ZHADID) updates.ZHADID = hr.zhAdid;
          if (hr.zhName && !hr.ZHName) updates.ZHName = hr.zhName;
          if (hr.yesEmail && !hr.YesEmail) updates.YesEmail = hr.yesEmail;
          if (hr.mobile && !hr.Mobile) updates.Mobile = hr.mobile;
          
          // Initialize required new fields with empty values if they don't exist
          if (!hr.EmpNo) updates.EmpNo = hr.empAdid || '';
          
          // Only update if we have changes
          if (Object.keys(updates).length > 0) {
            await tx.table('hierarchy_master').update(hr.id, updates);
          }
        }
        
        console.log('Hierarchy master migration completed');
      } catch (error) {
        console.error('Error migrating hierarchy records:', error);
      }
    });

    // Version 9: Add Smartfin fields to processed_leads
    this.version(9).stores({
      // Keep the same schema and add smartfinUploadStatus index
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode, smartfinUploadStatus',
      
      // Carry forward all other table definitions
      pincode_branch: 'id, Pincode, BranchCode, BranchName, Cluster, Region',
      hierarchy_master: 'id, EmpADID, FullName, Role, Team, Region, Zone',
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, psmAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      ai_prompts_master: 'id, name, category, prompt, systemPrompt, modelType',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail, aiTokensConsumed',
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity'
    });

    // Version 10: Add missing indexes for backward compatibility
    this.version(10).stores({
      // Add indexes for backward compatibility fields
      hierarchy_master: 'id, EmpADID, empAdid, FullName, fullName, employeeName, Role, Team, Region, region, Zone, RBLADIDCode, rblAdid, ZHADID, zhAdid, YesEmail, yesEmail',
      
      // Carry forward all other table definitions
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode, smartfinUploadStatus',
      pincode_branch: 'id, Pincode, BranchCode, BranchName, Cluster, Region',
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, psmAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      ai_prompts_master: 'id, name, category, prompt, systemPrompt, modelType',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail, aiTokensConsumed',
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity'
    });
    
    // Version 10: Add upgrade function to migrate any needed field mappings
    this.version(10).upgrade(async tx => {
      console.log('Running database upgrade to version 10...');
      
      // Migrate HierarchyMaster records to ensure compatibility fields are filled
      try {
        const hierarchyRecords = await tx.table('hierarchy_master').toArray();
        console.log(`Ensuring compatibility fields for ${hierarchyRecords.length} hierarchy records...`);
        
        for (const hr of hierarchyRecords) {
          const updates: Partial<HierarchyMaster> = {};
          
          // Map new fields to old fields for compatibility
          if (hr.EmpADID && !hr.empAdid) updates.empAdid = hr.EmpADID;
          if (hr.FullName && !hr.fullName) updates.fullName = hr.FullName;
          if (hr.FullName && !hr.employeeName) updates.employeeName = hr.FullName;
          if (hr.RBLADIDCode && !hr.rblAdid) updates.rblAdid = hr.RBLADIDCode;
          if (hr.RBLName && !hr.rblName) updates.rblName = hr.RBLName;
          if (hr.Region && !hr.region) updates.region = hr.Region;
          if (hr.ZHADID && !hr.zhAdid) updates.zhAdid = hr.ZHADID;
          if (hr.ZHName && !hr.zhName) updates.zhName = hr.ZHName;
          if (hr.YesEmail && !hr.yesEmail) updates.yesEmail = hr.YesEmail;
          if (hr.Mobile && !hr.mobile) updates.mobile = hr.Mobile;
          
          // Map old fields to new fields if new fields don't exist
          if (hr.empAdid && !hr.EmpADID) updates.EmpADID = hr.empAdid;
          if ((hr.fullName || hr.employeeName) && !hr.FullName) {
            updates.FullName = hr.fullName || hr.employeeName || '';
          }
          if (hr.rblAdid && !hr.RBLADIDCode) updates.RBLADIDCode = hr.rblAdid;
          if (hr.rblName && !hr.RBLName) updates.RBLName = hr.rblName;
          if (hr.region && !hr.Region) updates.Region = hr.region;
          if (hr.zhAdid && !hr.ZHADID) updates.ZHADID = hr.zhAdid;
          if (hr.zhName && !hr.ZHName) updates.ZHName = hr.zhName;
          if (hr.yesEmail && !hr.YesEmail) updates.YesEmail = hr.yesEmail;
          if (hr.mobile && !hr.Mobile) updates.Mobile = hr.mobile;
          
          // Only update if we have changes
          if (Object.keys(updates).length > 0) {
            await tx.table('hierarchy_master').update(hr.id, updates);
          }
        }
        
        console.log('Hierarchy master compatibility fields updated');
      } catch (error) {
        console.error('Error updating hierarchy compatibility fields:', error);
      }
    });

    // Version 11: Add smartfin_status_updates table
    this.version(11).stores({
      // New table for Smartfin Status Updates
      smartfin_status_updates: '&applicationNo, createdDate, status, rmName, firmName',
      
      // Carry forward all other table definitions
      hierarchy_master: 'id, EmpADID, empAdid, FullName, fullName, employeeName, Role, Team, Region, region, Zone, RBLADIDCode, rblAdid, ZHADID, zhAdid, YesEmail, yesEmail',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode, smartfinUploadStatus',
      pincode_branch: 'id, Pincode, BranchCode, BranchName, Cluster, Region',
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, psmAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
      ai_prompts_master: 'id, name, category, prompt, systemPrompt, modelType',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail, aiTokensConsumed',
      anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
      holiday_master: 'id, Date, HolidayType, date, name, type, description',
      rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
      error_codes: '++id, errorCode, module, severity'
    });

    // Version 12: Add email_template_master table
    this.version(12).stores({
      // Define a completely new table with a clear primary key
      email_template_master: 'id, templateName, category, isActive',
      
      // Keep existing tables with their original primary keys - don't modify them
      anchor_master: 'id, anchorname, programname, segment',
      hierarchy_master: 'id, EmpADID, FullName, YesEmail, RBLADIDCode, RBLName, ZHADID, ZHName, CBLCodeADID',
      holiday_master: 'id, date, Date, type, HolidayType',
      pincode_branch: 'id, Pincode, BranchCode, BranchName, Region',
      rm_branch: 'id, rmId, rmName, branchCode, region, active',
      error_codes: 'id, errorCode, module, severity',
      processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus',
      lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail, recipientAdidOrEmail, leadId, rmEmail, messageType',
      lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeType, currentAssigneeAdid, psmAdid, updatedAt',
      smartfin_status_updates: 'applicationNo, firmName, status, rmName, createdDate',
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
  hierarchy_master: ['id', 'Old No', 'Emp No', 'Emp ADID', 'Full Name', 'Gender', 'Emp Status', 'Functional Designation', 'Cat', 'Role', 'Team', 'CBL Code', 'CBL Code ADID', 'CBL Name', 'Cluster', 'RBL Code', 'RBL ADID Code', 'RBL Name', 'Region', 'ZH Code', 'ZH ADID', 'ZH Name', 'Zone', 'Vertical', 'Branch Code', 'Office Location Code', 'Location', 'City', 'State', 'Date Of Joining', 'Yes Email', 'Mobile', 'Exit Month/Resign date', 'Remarks', 'Segment'],
  holiday_master: ['id', 'Date', 'HolidayType', 'date', 'name', 'type', 'description'],
  pincode_branch: ['id', 'Pincode', 'Branch Code', 'Branch Name', 'Cluster', 'Region'],
  rm_branch: ['id', 'rmId', 'rmName', 'branchCode', 'branchName', 'region', 'role', 'active'],
  error_codes: ['id', 'errorCode', 'description', 'module', 'severity'],
  processed_leads: [],  // No direct upload via master UI, populated programmatically
  lead_communications: ['id', 'leadId', 'rmEmail', 'messageType', 'content', 'timestamp', 'sender', 'recipient', 'processedLeadId', 'communicationType', 'title', 'description', 'senderType', 'senderAdidOrEmail', 'recipientAdidOrEmail', 'ccEmails', 'aiSummary', 'aiDecision', 'aiTokensConsumed', 'attachments', 'relatedWorkflowStateId'],
  lead_workflow_states: ['id', 'processedLeadId', 'currentStage', 'currentAssigneeType', 'currentAssigneeAdid', 'psmAdid', 'lastStageChangeTimestamp', 'lastCommunicationTimestamp', 'nextFollowUpTimestamp', 'escalationLevel', 'droppedReason', 'updatedAt', 'createdAt'],
  smartfin_status_updates: ['applicationNo', 'createdDate', 'firmName', 'applicationType', 'status', 'branch', 'requestedAmount', 'sanctionedAmount', 'sanctionDate', 'programMappedDate', 'rmName', 'rmTAT', 'cpaName', 'cpaTAT', 'cmName', 'cmTAT', 'approvalRequestedDate', 'approvalTAT', 'totalTAT', 'uploadTimestamp'],
  email_template_master: ['id', 'templateName', 'category', 'isActive', 'description', 'subject', 'body', 'toRecipients', 'ccRecipients', 'createdAt', 'updatedAt'],
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
      
      // Process and map the data according to store type
      let processedData: any[] = [];
      
      if (storeName === 'smartfin_status_updates') {
        // Use the mapping function for Smartfin Status Updates
        processedData = json.map(row => mapSmartfinStatusUpdateUIToDB(row));
      } else {
        // For other stores, perform standard processing
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
          
          // Handle field mappings for Pincode Branch - map new fields to our interface properties
          if (storeName === 'pincode_branch') {
            // Map Excel headers to interface properties
            if (row['Pincode']) row.Pincode = String(row['Pincode']);
            if (row['Branch Code']) row.BranchCode = String(row['Branch Code']);
            if (row['Branch Name']) row.BranchName = String(row['Branch Name']);
            if (row['Cluster']) row.Cluster = String(row['Cluster']);
            if (row['Region']) row.Region = String(row['Region']);
            
            // Handle backward compatibility with old field names
            if (!row.Pincode && row.pincode) row.Pincode = row.pincode;
            if (!row.BranchCode && row.branchCode) row.BranchCode = row.branchCode;
            if (!row.BranchName && row.branchName) row.BranchName = row.branchName;
            if (!row.Region && row.region) row.Region = row.region;
          }
          
          // Handle field mappings for Hierarchy Master - map new fields to our interface properties
          if (storeName === 'hierarchy_master') {
            // Map Excel headers to interface properties
            if (row['Old No']) row.OldNo = String(row['Old No']);
            if (row['Emp No']) row.EmpNo = String(row['Emp No']);
            if (row['Emp ADID']) row.EmpADID = String(row['Emp ADID']);
            if (row['Full Name']) row.FullName = String(row['Full Name']);
            if (row['Gender']) row.Gender = String(row['Gender']);
            if (row['Emp Status']) row.EmpStatus = String(row['Emp Status']);
            if (row['Functional Designation']) row.FunctionalDesignation = String(row['Functional Designation']);
            if (row['Cat']) row.Cat = String(row['Cat']);
            if (row['Role']) row.Role = String(row['Role']);
            if (row['Team']) row.Team = String(row['Team']);
            if (row['CBL Code']) row.CBLCode = String(row['CBL Code']);
            if (row['CBL Code ADID']) row.CBLCodeADID = String(row['CBL Code ADID']);
            if (row['CBL Name']) row.CBLName = String(row['CBL Name']);
            if (row['Cluster']) row.Cluster = String(row['Cluster']);
            if (row['RBL Code']) row.RBLCode = String(row['RBL Code']);
            if (row['RBL ADID Code']) row.RBLADIDCode = String(row['RBL ADID Code']);
            if (row['RBL Name']) row.RBLName = String(row['RBL Name']);
            if (row['Region']) row.Region = String(row['Region']);
            if (row['ZH Code']) row.ZHCode = String(row['ZH Code']);
            if (row['ZH ADID']) row.ZHADID = String(row['ZH ADID']);
            if (row['ZH Name']) row.ZHName = String(row['ZH Name']);
            if (row['Zone']) row.Zone = String(row['Zone']);
            if (row['Vertical']) row.Vertical = String(row['Vertical']);
            if (row['Branch Code']) row.BranchCode = String(row['Branch Code']);
            if (row['Office Location Code']) row.OfficeLocationCode = String(row['Office Location Code']);
            if (row['Location']) row.Location = String(row['Location']);
            if (row['City']) row.City = String(row['City']);
            if (row['State']) row.State = String(row['State']);
            if (row['Date Of Joining']) row.DateOfJoining = String(row['Date Of Joining']);
            if (row['Yes Email']) row.YesEmail = String(row['Yes Email']);
            if (row['Mobile']) row.Mobile = String(row['Mobile']);
            if (row['Exit Month/Resign date']) row.ExitMonthResignDate = String(row['Exit Month/Resign date']);
            if (row['Remarks']) row.Remarks = String(row['Remarks']);
            if (row['Segment']) row.Segment = String(row['Segment']);
            
            // Handle backward compatibility with old field names
            if (!row.EmpADID && row.empAdid) row.EmpADID = row.empAdid;
            if (!row.FullName && row.fullName) row.FullName = row.fullName;
            if (!row.FullName && row.employeeName) row.FullName = row.employeeName;
            if (!row.RBLADIDCode && row.rblAdid) row.RBLADIDCode = row.rblAdid;
            if (!row.RBLName && row.rblName) row.RBLName = row.rblName;
            if (!row.Region && row.region) row.Region = row.region;
            if (!row.ZHADID && row.zhAdid) row.ZHADID = row.zhAdid;
            if (!row.ZHName && row.zhName) row.ZHName = row.zhName;
            if (!row.YesEmail && row.yesEmail) row.YesEmail = row.yesEmail;
            if (!row.Mobile && row.mobile) row.Mobile = row.mobile;
            
            // Make sure EmpADID is used as id if available
            if (row.EmpADID && !row.id) row.id = row.EmpADID;
          }
          
          processedData.push(row);
        }
      }
      
      // Use the database's specific table method to avoid type issues
      if (storeName === 'anchor_master') {
        // Process 100 records at a time to avoid overwhelming the database
        for (let i = 0; i < processedData.length; i += 100) {
          await db.anchor_master.bulkPut(processedData.slice(i, i + 100));
        }
      } else if (storeName === 'hierarchy_master') {
        for (let i = 0; i < processedData.length; i += 100) {
          await db.hierarchy_master.bulkPut(processedData.slice(i, i + 100));
        }
      } else if (storeName === 'holiday_master') {
        for (let i = 0; i < processedData.length; i += 100) {
          await db.holiday_master.bulkPut(processedData.slice(i, i + 100));
        }
      } else if (storeName === 'pincode_branch') {
        for (let i = 0; i < processedData.length; i += 100) {
          await db.pincode_branch.bulkPut(processedData.slice(i, i + 100));
        }
      } else if (storeName === 'rm_branch') {
        for (let i = 0; i < processedData.length; i += 100) {
          await db.rm_branch.bulkPut(processedData.slice(i, i + 100));
        }
      } else if (storeName === 'smartfin_status_updates') {
        for (let i = 0; i < processedData.length; i += 100) {
          await db.smartfin_status_updates.bulkPut(processedData.slice(i, i + 100));
        }
      } else if (storeName === 'email_template_master') {
        for (let i = 0; i < processedData.length; i += 100) {
          await db.email_template_master.bulkPut(processedData.slice(i, i + 100));
        }
      }
      
      return { success: errors.length === 0, errors };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Download Excel template for a store
  static downloadTemplate<T extends StoreName>(storeName: T) {
    const workbook = XLSX.utils.book_new();
    let data = [];
    
    // Create header row based on store
    if (storeName === 'smartfin_status_updates') {
      data.push(SMARTFIN_UPDATE_TEMPLATE_HEADERS);
    } else {
      data.push(STORE_FIELDS[storeName]);
    }
    
    // Add a sample row
    data.push(Array(data[0].length).fill(''));
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Generate file name
    const fileName = `${storeName}_template.xlsx`;
    
    // Create Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
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