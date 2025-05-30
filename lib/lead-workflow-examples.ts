import { v4 as uuidv4 } from 'uuid';
import { 
  LeadWorkflowState, 
  LeadCommunication,
  createLeadWorkflowState,
  createLeadCommunication,
  updateLeadWorkflowState,
  createLeadAssignmentCommunication,
  createRMReplyCommunication,
  updateWorkflowStateAfterCommunication,
  getLeadWorkflowStateByProcessedLeadId,
  getLeadCommunicationsByProcessedLeadId
} from './lead-workflow';

/**
 * Example: Handling a new lead assignment in NewLeads component
 */
export async function handleNewLeadAssignment(
  processedLeadId: string,
  rmAdid: string,
  rmEmail: string,
  psmAdid: string
): Promise<void> {
  try {
    console.log(`[Lead Workflow] Starting lead assignment workflow for lead ${processedLeadId}`);
    console.log(`[Lead Workflow] RM: ${rmAdid} (${rmEmail}), PSM: ${psmAdid}`);
    
    // 1. Create a workflow state record for the lead
    console.log(`[Lead Workflow] Creating workflow state record...`);
    const workflowState = await createLeadWorkflowState(
      processedLeadId,
      rmAdid,
      psmAdid
    );
    console.log(`[Lead Workflow] Created workflow state with ID: ${workflowState.id}`);
    
    // 2. Log an assignment communication
    console.log(`[Lead Workflow] Generating email content and creating communication record...`);
    const communication = await createLeadAssignmentCommunication(
      processedLeadId,
      rmEmail,
      workflowState.id
    );
    console.log(`[Lead Workflow] Created email communication with ID: ${communication.id}`);
    
    // 3. Update the workflow state to reflect the assignment email was sent
    console.log(`[Lead Workflow] Updating workflow state to RM_AwaitingReply...`);
    await updateLeadWorkflowState(workflowState.id, {
      currentStage: 'RM_AwaitingReply',
      nextFollowUpTimestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    });
    
    console.log(`[Lead Workflow] Assignment workflow completed successfully for lead ${processedLeadId}`);
  } catch (error) {
    console.error(`[Lead Workflow] ERROR in lead assignment for ${processedLeadId}:`, error);
    throw error;
  }
}

/**
 * Example: Handling an RM reply in RMInbox component
 */
export async function handleRMReply(
  processedLeadId: string,
  rmEmail: string,
  replyContent: string,
  attachments?: { name: string; size: string; url?: string; type: string }[]
): Promise<void> {
  try {
    // 1. Get the current workflow state
    const workflowState = await getLeadWorkflowStateByProcessedLeadId(processedLeadId);
    
    if (!workflowState) {
      throw new Error(`No workflow state found for lead ${processedLeadId}`);
    }
    
    // 2. Create a simulated AI analysis (in real app, call AI service)
    const aiSummary = `Analyzed RM reply: ${replyContent.substring(0, 50)}...`;
    const aiDecision = "Response acknowledged. Continue monitoring.";
    
    // 3. Log the RM reply with AI analysis
    const communication = await createRMReplyCommunication(
      processedLeadId,
      rmEmail,
      replyContent,
      aiSummary,
      aiDecision,
      attachments
    );
    
    // 4. Update the workflow state based on AI decision
    // In this example, we're just updating the timestamps, but in a real app
    // you might change the stage based on AI analysis
    await updateWorkflowStateAfterCommunication(
      workflowState.id
    );
    
    console.log(`RM reply processed for lead ${processedLeadId}`);
  } catch (error) {
    console.error('Error processing RM reply:', error);
    throw error;
  }
}

/**
 * Example: Handling a PSM decision in PSMLeads component
 */
export async function handlePSMDecision(
  processedLeadId: string,
  psmAdid: string,
  decision: 'reassign' | 'drop',
  reason: string
): Promise<void> {
  try {
    // 1. Get the current workflow state
    const workflowState = await getLeadWorkflowStateByProcessedLeadId(processedLeadId);
    
    if (!workflowState) {
      throw new Error(`No workflow state found for lead ${processedLeadId}`);
    }
    
    // 2. Create appropriate communication based on decision
    if (decision === 'reassign') {
      await createLeadCommunication({
        processedLeadId,
        communicationType: 'PSMDecision_ReassignToRM',
        title: 'Lead Reassigned to RM by PSM',
        description: reason,
        senderType: 'PSM',
        senderAdidOrEmail: psmAdid,
        recipientAdidOrEmail: workflowState.currentAssigneeAdid,
        relatedWorkflowStateId: workflowState.id
      });
      
      // 3. Update workflow state
      await updateLeadWorkflowState(workflowState.id, {
        currentStage: 'RM_ReassignmentEmailPending',
        lastStageChangeTimestamp: new Date().toISOString()
      });
    } else {
      // Handle drop decision
      await createLeadCommunication({
        processedLeadId,
        communicationType: 'PSMDecision_DropLead',
        title: 'Lead Dropped by PSM',
        description: reason,
        senderType: 'PSM',
        senderAdidOrEmail: psmAdid,
        recipientAdidOrEmail: workflowState.currentAssigneeAdid,
        relatedWorkflowStateId: workflowState.id
      });
      
      // Update workflow state
      await updateLeadWorkflowState(workflowState.id, {
        currentStage: 'Dropped',
        droppedReason: reason,
        lastStageChangeTimestamp: new Date().toISOString()
      });
    }
    
    console.log(`PSM decision (${decision}) processed for lead ${processedLeadId}`);
  } catch (error) {
    console.error('Error processing PSM decision:', error);
    throw error;
  }
}

/**
 * Example: System follow-up/escalation
 */
export async function handleSystemFollowUp(
  processedLeadId: string,
  isEscalation: boolean = false
): Promise<void> {
  try {
    // 1. Get the current workflow state
    const workflowState = await getLeadWorkflowStateByProcessedLeadId(processedLeadId);
    
    if (!workflowState) {
      throw new Error(`No workflow state found for lead ${processedLeadId}`);
    }
    
    // 2. Determine escalation level (if applicable)
    let newEscalationLevel = workflowState.escalationLevel;
    let newStage = workflowState.currentStage;
    
    if (isEscalation) {
      newEscalationLevel += 1;
      
      // Update stage based on escalation level
      if (newEscalationLevel === 1) {
        newStage = 'RM_Escalation1';
      } else if (newEscalationLevel === 2) {
        newStage = 'PSM_ReviewPending';
      }
    }
    
    // 3. Create follow-up/escalation communication
    await createLeadCommunication({
      processedLeadId,
      communicationType: isEscalation ? 'SystemFollowUpEmail' : 'SystemReminderEmail',
      title: isEscalation ? `Escalation Email Sent (Level ${newEscalationLevel})` : 'Follow-up Email Sent',
      description: isEscalation 
        ? `Escalation email sent to ${workflowState.currentAssigneeAdid} due to lack of response.`
        : `Reminder email sent to ${workflowState.currentAssigneeAdid} for lead follow-up.`,
      senderType: 'System',
      senderAdidOrEmail: 'system@scfleadmgmt.com',
      recipientAdidOrEmail: workflowState.currentAssigneeAdid,
      relatedWorkflowStateId: workflowState.id
    });
    
    // 4. Update workflow state
    const nextFollowUpTimestamp = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days from now
    
    await updateLeadWorkflowState(workflowState.id, {
      currentStage: newStage,
      escalationLevel: newEscalationLevel,
      nextFollowUpTimestamp,
      lastCommunicationTimestamp: new Date().toISOString()
    });
    
    console.log(`System ${isEscalation ? 'escalation' : 'follow-up'} sent for lead ${processedLeadId}`);
  } catch (error) {
    console.error('Error sending system follow-up:', error);
    throw error;
  }
} 