import { v4 as uuidv4 } from 'uuid';
import db from './db';
import { generateLeadAssignmentEmail } from './lead-utils';

// Interface definitions
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

export interface LeadCommunication {
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
    'PSM_Sent_Back_To_RM' |
    'PSM_Closed_Lead' |
    'PSM_Bulk_Closed_Lead' |
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
  aiTokensConsumed?: number;
  attachments?: { name: string; size: string; url?: string; type: string }[]; // Array of attachment objects
  relatedWorkflowStateId?: string; // Optional FK to LeadWorkflowState.id
}

// Map of workflow stages to flag display values
export const stageToFlagMap: Record<string, string> = {
  // RM stages
  'RM_AssignmentEmailPending': 'With RM',
  'RM_AwaitingReply': 'With RM',
  'RM_ReassignmentEmailPending': 'With RM',
  
  // Escalation stages
  'RM_Escalation1': 'Escalation 1',
  'RM_Escalation2': 'Escalation 2',
  
  // PSM stages - for leads requiring PSM review or action
  'PSM_ReviewPending': 'With PSM',   // Lead has been escalated to PSM for review
  'PSM_Assigned': 'With PSM',        // Lead has been explicitly assigned to a PSM
  'PSM_AwaitingAction': 'With PSM',  // Lead is waiting for PSM to take action
  
  // Admin Review stage
  'AdminReviewPending': 'Program Review', // Lead requires admin/program review
  
  // Other stages
  'Dropped': 'Dropped',
  'ClosedLead': 'Closed',           // Lead has been closed by PSM
  // Add more mappings as needed
};

/**
 * Creates a new lead workflow state record
 */
export async function createLeadWorkflowState(
  processedLeadId: string,
  currentAssigneeAdid: string,
  psmAdid: string
): Promise<LeadWorkflowState> {
  const now = new Date().toISOString();
  
  const workflowState: LeadWorkflowState = {
    id: uuidv4(),
    processedLeadId,
    currentStage: 'RM_AssignmentEmailPending',
    currentAssigneeType: 'RM',
    currentAssigneeAdid,
    psmAdid,
    lastStageChangeTimestamp: now,
    lastCommunicationTimestamp: now,
    nextFollowUpTimestamp: now,
    escalationLevel: 0,
    droppedReason: null,
    updatedAt: now,
    createdAt: now
  };
  
  try {
    await db.table('lead_workflow_states').add(workflowState);
    return workflowState;
  } catch (error) {
    console.error('Failed to create lead workflow state:', error);
    throw error;
  }
}

/**
 * Updates an existing lead workflow state
 */
export async function updateLeadWorkflowState(
  id: string,
  updates: Partial<LeadWorkflowState>
): Promise<void> {
  try {
    // Always update the updatedAt timestamp
    updates.updatedAt = new Date().toISOString();
    
    await db.table('lead_workflow_states').update(id, updates);
  } catch (error) {
    console.error('Failed to update lead workflow state:', error);
    throw error;
  }
}

/**
 * Gets a lead workflow state by processed lead ID
 */
export async function getLeadWorkflowStateByProcessedLeadId(
  processedLeadId: string
): Promise<LeadWorkflowState | undefined> {
  try {
    return await db.table('lead_workflow_states')
      .where('processedLeadId')
      .equals(processedLeadId)
      .first();
  } catch (error) {
    console.error('Failed to get lead workflow state:', error);
    throw error;
  }
}

/**
 * Creates a new lead communication record
 */
export async function createLeadCommunication(
  data: Omit<LeadCommunication, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<LeadCommunication> {
  const now = new Date().toISOString();
  
  // Ensure we're using processedLeadId, not leadId
  if (!data.processedLeadId) {
    console.error('processedLeadId is required for lead communications');
    throw new Error('processedLeadId is required for lead communications');
  }
  
  const communication: LeadCommunication = {
    id: uuidv4(),
    timestamp: data.timestamp || now,
    processedLeadId: data.processedLeadId,
    communicationType: data.communicationType,
    title: data.title,
    description: data.description,
    senderType: data.senderType,
    senderAdidOrEmail: data.senderAdidOrEmail,
    recipientAdidOrEmail: data.recipientAdidOrEmail,
    ccEmails: data.ccEmails || [],
    aiSummary: data.aiSummary,
    aiDecision: data.aiDecision,
    aiTokensConsumed: data.aiTokensConsumed,
    attachments: data.attachments || [],
    relatedWorkflowStateId: data.relatedWorkflowStateId
  };
  
  try {
    // Log all fields for debugging
    console.log('Creating lead communication with data:', {
      id: communication.id,
      processedLeadId: communication.processedLeadId,
      communicationType: communication.communicationType,
      senderType: communication.senderType,
      recipientAdidOrEmail: communication.recipientAdidOrEmail
    });
    
    await db.table('lead_communications').add(communication);
    return communication;
  } catch (error) {
    console.error('Failed to create lead communication:', error);
    throw error;
  }
}

/**
 * Gets all lead communications for a processed lead ID
 */
export async function getLeadCommunicationsByProcessedLeadId(
  processedLeadId: string
): Promise<LeadCommunication[]> {
  try {
    return await db.table('lead_communications')
      .where('processedLeadId')
      .equals(processedLeadId)
      .toArray();
  } catch (error) {
    console.error('Failed to get lead communications:', error);
    throw error;
  }
}

/**
 * Creates a lead assignment communication
 */
export async function createLeadAssignmentCommunication(
  processedLeadId: string, 
  rmEmail: string,
  workflowStateId: string
): Promise<LeadCommunication> {
  try {
    console.log(`[Lead Communication] Starting email generation for lead ${processedLeadId}`);
    // Get the processed lead record to include details in the email
    const processedLead = await db.processed_leads.get(processedLeadId);
    
    if (!processedLead) {
      console.error(`[Lead Communication] ERROR: Processed lead ${processedLeadId} not found`);
      throw new Error(`Processed lead ${processedLeadId} not found`);
    }
    
    console.log(`[Lead Communication] Found processed lead record: ${processedLead.id}`);
    console.log(`[Lead Communication] Assigned RM: ${processedLead.assignedRmAdid}`);
    
    // Get the RM name from rm_branch or use a default
    let rmName = "RM";
    try {
      console.log(`[Lead Communication] Looking up RM details for ${processedLead.assignedRmAdid}`);
      const rmRecord = await db.rm_branch
        .where('rmId')
        .equals(processedLead.assignedRmAdid || '')
        .first();
      
      if (rmRecord) {
        rmName = rmRecord.rmName;
        console.log(`[Lead Communication] Found RM name: ${rmName}`);
      } else {
        console.log(`[Lead Communication] RM record not found, using default name`);
      }
    } catch (error) {
      console.warn(`[Lead Communication] Error getting RM name:`, error);
      // Continue with default name
    }
    
    // Generate the email content
    const dealerName = processedLead.originalData["Name of the Firm"] || "Dealer";
    const anchorName = processedLead.anchorNameSelected;
    console.log(`[Lead Communication] Generating email for dealer: ${dealerName}, anchor: ${anchorName}`);
    
    const emailContent = generateLeadAssignmentEmail(
      dealerName,
      anchorName,
      rmName,
      processedLead.originalData
    );
    
    console.log(`[Lead Communication] Email content generated (${emailContent.length} chars)`);
    
    // Create the communication record
    console.log(`[Lead Communication] Creating communication record in database...`);
    const communication = await createLeadCommunication({
      processedLeadId,
      communicationType: 'LeadAssignmentEmail',
      title: `Lead Assignment Email - ${dealerName}`,
      description: emailContent,
      senderType: 'System',
      senderAdidOrEmail: 'system@scfleadmgmt.com',
      recipientAdidOrEmail: rmEmail,
      relatedWorkflowStateId: workflowStateId
    });
    
    console.log(`[Lead Communication] Email record created successfully with ID: ${communication.id}`);
    return communication;
  } catch (error) {
    console.error(`[Lead Communication] ERROR creating lead assignment communication:`, error);
    // Create a basic communication record in case of error
    console.log(`[Lead Communication] Creating fallback communication record...`);
    return createLeadCommunication({
      processedLeadId,
      communicationType: 'LeadAssignmentEmail',
      title: 'Lead Assignment Email Sent',
      description: 'Initial notification sent to RM about new lead assignment.',
      senderType: 'System',
      senderAdidOrEmail: 'system@scfleadmgmt.com',
      recipientAdidOrEmail: rmEmail,
      relatedWorkflowStateId: workflowStateId
    });
  }
}

/**
 * Creates a new RM reply communication
 */
export async function createRMReplyCommunication(
  processedLeadId: string,
  rmEmail: string,
  replyContent: string,
  aiSummary?: string,
  aiDecision?: string,
  aiTokensConsumed?: number,
  attachments?: { name: string; size: string; url?: string; type: string }[]
): Promise<LeadCommunication> {
  try {
    // Create the communication record
    const communication = await createLeadCommunication({
      processedLeadId,
      communicationType: 'RMReply',
      title: 'RM Reply Received',
      description: replyContent,
      senderType: 'RM',
      senderAdidOrEmail: rmEmail,
      recipientAdidOrEmail: 'system@scfleadmgmt.com',
      aiSummary,
      aiDecision,
      aiTokensConsumed,
      attachments
    });

    // Get the workflow state to update it
    const workflowState = await getLeadWorkflowStateByProcessedLeadId(processedLeadId);
    
    if (workflowState) {
      const now = new Date().toISOString();
      let updates: Partial<LeadWorkflowState> = {
        lastCommunicationTimestamp: now,
        updatedAt: now
      };
      
      // If AI decision is available, update the workflow state accordingly
      if (aiDecision) {
        let newStage = workflowState.currentStage;
        
        // Map AI decision to workflow stage
        if (aiDecision === 'Dealer Not Interested') {
          newStage = 'Dropped';
          updates.droppedReason = 'AI: Dealer Not Interested';
        } else if (aiDecision === 'Admin Review') {
          newStage = 'AdminReviewPending';
          // Set current assignee to the system for admin review
          updates.currentAssigneeType = 'System';
          updates.currentAssigneeAdid = 'system'; // Will be reassigned by admin
        } else if (aiDecision === 'FollowUp') {
          newStage = 'RM_AwaitingReply';
          // Set next follow-up timestamp to 2 days from now
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 2);
          updates.nextFollowUpTimestamp = followUpDate.toISOString();
        }
        
        // Only update stage if it changed
        if (newStage !== workflowState.currentStage) {
          updates.currentStage = newStage;
          updates.lastStageChangeTimestamp = now;
        }
      }
      
      // Update the workflow state
      await updateLeadWorkflowState(workflowState.id, updates);
    }
    
    return communication;
  } catch (error) {
    console.error('Failed to create RM reply communication:', error);
    throw error;
  }
}

/**
 * Helper function to update lead workflow state after communication
 */
export async function updateWorkflowStateAfterCommunication(
  workflowStateId: string,
  newStage?: string,
  escalationLevel?: number
): Promise<void> {
  const now = new Date().toISOString();
  const updates: Partial<LeadWorkflowState> = {
    lastCommunicationTimestamp: now
  };
  
  if (newStage) {
    updates.currentStage = newStage;
    updates.lastStageChangeTimestamp = now;
  }
  
  if (escalationLevel !== undefined) {
    updates.escalationLevel = escalationLevel;
  }
  
  await updateLeadWorkflowState(workflowStateId, updates);
} 