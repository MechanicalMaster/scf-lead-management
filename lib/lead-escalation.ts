// lib/lead-escalation.ts
// This file handles the automated escalation logic for RM leads

import { differenceInDays, differenceInHours, parseISO } from 'date-fns';
import db from './db';
import {
  updateLeadWorkflowState,
  createLeadCommunication,
  getLeadWorkflowStateByProcessedLeadId
} from './lead-workflow';
import { LeadWorkflowState, ProcessedLead } from './db';
import { WORKFLOW_STAGES } from './constants';

/**
 * Escalation configuration
 */
export const ESCALATION_CONFIG = {
  // Number of days after which to send first reminder to RM
  FIRST_REMINDER_DAYS: 3,
  
  // Number of days after which to escalate to Level 1 (after assignment)
  ESCALATION_LEVEL_1_DAYS: 5,
  
  // Number of days after which to escalate to Level 2 (after Level 1)
  ESCALATION_LEVEL_2_DAYS: 3,
  
  // Number of days after which to escalate to PSM (after Level 2)
  ESCALATION_TO_PSM_DAYS: 2,
};

/**
 * Represents the escalation status of a lead
 */
export interface EscalationStatus {
  requiresReminder: boolean;
  requiresEscalation: boolean;
  newEscalationLevel: number;
  newStage: string;
  daysSinceLastUpdate: number;
}

/**
 * Check if a lead needs to be escalated based on its workflow state
 */
export function checkEscalationStatus(workflowState: LeadWorkflowState): EscalationStatus {
  const now = new Date();
  const lastUpdate = parseISO(workflowState.lastStageChangeTimestamp);
  const daysSinceLastUpdate = differenceInDays(now, lastUpdate);
  
  // Initialize with default values
  const status: EscalationStatus = {
    requiresReminder: false,
    requiresEscalation: false,
    newEscalationLevel: workflowState.escalationLevel,
    newStage: workflowState.currentStage,
    daysSinceLastUpdate
  };
  
  // Skip leads not with RM or already escalated to PSM
  if (
    workflowState.currentStage === WORKFLOW_STAGES.DROPPED ||
    workflowState.currentStage === WORKFLOW_STAGES.CLOSED ||
    workflowState.currentAssigneeType !== 'RM' ||
    workflowState.currentStage === WORKFLOW_STAGES.PSM_REVIEW_PENDING
  ) {
    return status;
  }
  
  // First reminder check (no escalation level change)
  if (
    workflowState.escalationLevel === 0 &&
    daysSinceLastUpdate >= ESCALATION_CONFIG.FIRST_REMINDER_DAYS &&
    daysSinceLastUpdate < ESCALATION_CONFIG.ESCALATION_LEVEL_1_DAYS
  ) {
    status.requiresReminder = true;
    return status;
  }
  
  // Escalation Level 1
  if (
    workflowState.escalationLevel === 0 &&
    daysSinceLastUpdate >= ESCALATION_CONFIG.ESCALATION_LEVEL_1_DAYS
  ) {
    status.requiresEscalation = true;
    status.newEscalationLevel = 1;
    status.newStage = WORKFLOW_STAGES.RM_ESCALATION_1;
    return status;
  }
  
  // Escalation Level 2
  if (
    workflowState.escalationLevel === 1 &&
    daysSinceLastUpdate >= ESCALATION_CONFIG.ESCALATION_LEVEL_2_DAYS
  ) {
    status.requiresEscalation = true;
    status.newEscalationLevel = 2;
    status.newStage = WORKFLOW_STAGES.RM_ESCALATION_2;
    return status;
  }
  
  // Escalation to PSM
  if (
    workflowState.escalationLevel === 2 &&
    daysSinceLastUpdate >= ESCALATION_CONFIG.ESCALATION_TO_PSM_DAYS
  ) {
    status.requiresEscalation = true;
    status.newEscalationLevel = 3;
    status.newStage = WORKFLOW_STAGES.PSM_REVIEW_PENDING;
    return status;
  }
  
  return status;
}

/**
 * Process escalation for a single lead
 */
export async function processLeadEscalation(
  processedLeadId: string,
  workflowState: LeadWorkflowState
): Promise<boolean> {
  try {
    // Get the processed lead details for context
    const processedLead = await db.processed_leads.get(processedLeadId);
    if (!processedLead) {
      console.error(`Cannot escalate lead: processed lead ${processedLeadId} not found`);
      return false;
    }
    
    // Check escalation status
    const escalationStatus = checkEscalationStatus(workflowState);
    
    // If no action needed, return
    if (!escalationStatus.requiresReminder && !escalationStatus.requiresEscalation) {
      return false;
    }
    
    // Handle reminder (no escalation level change)
    if (escalationStatus.requiresReminder && !escalationStatus.requiresEscalation) {
      await createLeadCommunication({
        processedLeadId,
        communicationType: 'SystemReminderEmail',
        title: 'Follow-up Reminder',
        description: `This is a reminder that lead for ${processedLead.originalData["Name of the Firm"] || 'Unknown Dealer'} 
          has been awaiting your response for ${escalationStatus.daysSinceLastUpdate} days.`,
        senderType: 'System',
        senderAdidOrEmail: 'system@example.com',
        recipientAdidOrEmail: workflowState.currentAssigneeAdid,
        relatedWorkflowStateId: workflowState.id
      });
      
      // Update next follow-up time but don't change escalation level
      await updateLeadWorkflowState(workflowState.id, {
        nextFollowUpTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
      });
      
      console.log(`Sent reminder for lead ${processedLeadId}`);
      return true;
    }
    
    // Handle escalation
    if (escalationStatus.requiresEscalation) {
      // Determine who to notify based on new escalation level
      let recipientAdid = workflowState.currentAssigneeAdid;
      let ccEmails: string[] = [];
      let escalationTitle = 'Lead Escalation';
      let escalationDescription = `This lead has been escalated due to inactivity for ${escalationStatus.daysSinceLastUpdate} days.`;
      
      // For level 1 escalation - notify RM
      if (escalationStatus.newEscalationLevel === 1) {
        escalationTitle = 'Lead Escalation - Level 1';
        
        // Could add RM's manager to CC list if that data is available
      }
      // For level 2 escalation - notify RM and their manager
      else if (escalationStatus.newEscalationLevel === 2) {
        escalationTitle = 'Lead Escalation - Level 2';
        
        // Get hierarchy data to find RM's manager
        try {
          const rmHierarchy = await db.hierarchy_master
            .where('EmpADID')
            .equals(workflowState.currentAssigneeAdid)
            .first();
          
          if (rmHierarchy && rmHierarchy.RBLADIDCode) {
            ccEmails.push(`${rmHierarchy.RBLADIDCode}@example.com`);
          }
        } catch (error) {
          console.error('Error finding RM manager:', error);
        }
      }
      // For PSM escalation - change assignee to PSM
      else if (escalationStatus.newEscalationLevel === 3) {
        escalationTitle = 'Lead Escalated to PSM';
        escalationDescription = `This lead has been escalated to PSM after multiple unanswered reminders to RM.`;
        recipientAdid = workflowState.psmAdid;
        ccEmails.push(`${workflowState.currentAssigneeAdid}@example.com`);
      }
      
      // Create communication record for escalation
      await createLeadCommunication({
        processedLeadId,
        communicationType: 'SystemFollowUpEmail',
        title: escalationTitle,
        description: escalationDescription,
        senderType: 'System',
        senderAdidOrEmail: 'system@example.com',
        recipientAdidOrEmail: recipientAdid,
        ccEmails: ccEmails,
        relatedWorkflowStateId: workflowState.id
      });
      
      // Update workflow state with new escalation level
      const updates: Partial<LeadWorkflowState> = {
        escalationLevel: escalationStatus.newEscalationLevel,
        currentStage: escalationStatus.newStage,
        lastStageChangeTimestamp: new Date().toISOString(),
        nextFollowUpTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
      };
      
      // If escalated to PSM, change assignee type
      if (escalationStatus.newEscalationLevel === 3) {
        updates.currentAssigneeType = 'PSM';
        updates.currentAssigneeAdid = workflowState.psmAdid;
      }
      
      await updateLeadWorkflowState(workflowState.id, updates);
      
      console.log(`Escalated lead ${processedLeadId} to level ${escalationStatus.newEscalationLevel}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error in processLeadEscalation for ${processedLeadId}:`, error);
    return false;
  }
}

/**
 * Run the escalation process for all leads
 */
export async function runEscalationProcess(): Promise<{
  processed: number;
  escalated: number;
  reminded: number;
  errors: number;
}> {
  console.log('Starting lead escalation process...');
  
  const result = {
    processed: 0,
    escalated: 0,
    reminded: 0,
    errors: 0
  };
  
  try {
    // Get all workflow states for active leads
    const workflowStates = await db.lead_workflow_states
      .where('currentStage')
      .notEqual('Dropped')
      .and(state => state.currentStage !== 'ClosedLead')
      .toArray();
    
    console.log(`Found ${workflowStates.length} active workflow states to check`);
    
    // Process each workflow state
    for (const state of workflowStates) {
      try {
        result.processed++;
        
        // Check if this lead needs escalation
        const escalationStatus = checkEscalationStatus(state);
        
        if (escalationStatus.requiresEscalation || escalationStatus.requiresReminder) {
          const success = await processLeadEscalation(state.processedLeadId, state);
          
          if (success) {
            if (escalationStatus.requiresEscalation) {
              result.escalated++;
            } else if (escalationStatus.requiresReminder) {
              result.reminded++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing escalation for lead ${state.processedLeadId}:`, error);
        result.errors++;
      }
    }
    
    console.log(`Escalation process completed: ${result.processed} processed, ${result.escalated} escalated, ${result.reminded} reminded, ${result.errors} errors`);
    return result;
  } catch (error) {
    console.error('Error in runEscalationProcess:', error);
    throw error;
  }
} 