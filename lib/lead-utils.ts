import db from './db';
import { safeDbOperation } from './db-init';
import { handleNewLeadAssignment } from './lead-workflow-examples';

/**
 * Function to get an RM's email address from their ADID
 * Checks hierarchy_master and rm_branch tables
 */
export async function getEmailFromRmAdid(rmAdid: string): Promise<string> {
  try {
    // First check the hierarchy_master table using new field names
    const hierarchyRecord = await db.hierarchy_master
      .where('EmpADID')
      .equals(rmAdid)
      .or('RBLADIDCode')
      .equals(rmAdid)
      .first();
    
    if (hierarchyRecord?.YesEmail) {
      return hierarchyRecord.YesEmail;
    }
    
    // Fallback to old field names if needed
    if (!hierarchyRecord) {
      const oldHierarchyRecord = await db.hierarchy_master
        .where('id')
        .equals(rmAdid)
        .first();
      
      if (oldHierarchyRecord?.yesEmail) {
        return oldHierarchyRecord.yesEmail;
      }
    }
    
    // If not found or no email, check rm_branch for any identifying info
    const rmRecord = await db.rm_branch
      .where('rmId')
      .equals(rmAdid)
      .first();
    
    if (rmRecord) {
      // Use the RM name or ID to construct an email
      const rmEmail = `${rmRecord.rmName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      return rmEmail;
    }
    
    // If all else fails, generate a fallback email using the ADID
    return `rm.${rmAdid}@example.com`;
  } catch (error) {
    console.error('Error getting RM email:', error);
    // Return a fallback email in case of error
    return `rm.${rmAdid}@example.com`;
  }
}

/**
 * Function to get PSM details based on anchor name
 * Returns a tuple of [PSM ADID, PSM Email]
 */
export async function getPSMDetailsFromAnchor(anchorName: string): Promise<[string, string]> {
  try {
    // Look up PSM details from anchor_master
    const anchorRecord = await db.anchor_master
      .where('anchorname')
      .equals(anchorName)
      .first();
    
    if (anchorRecord?.PSMADID) {
      // Return PSM ADID and either actual email or generated one
      const psmEmail = anchorRecord.PSMEmail || `psm.${anchorRecord.PSMADID}@example.com`;
      return [anchorRecord.PSMADID, psmEmail];
    }
    
    // If not found, return default values
    return ['PSM001', 'default.psm@example.com'];
  } catch (error) {
    console.error('Error getting PSM details:', error);
    // Return fallback values in case of error
    return ['PSM001', 'default.psm@example.com'];
  }
}

/**
 * Generate a simulated email content for lead assignment
 */
export function generateLeadAssignmentEmail(
  dealerName: string,
  anchorName: string,
  rmName: string,
  leadDetails: Record<string, any>
): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
Subject: New Lead Assignment - ${dealerName} with ${anchorName}

Dear ${rmName},

A new lead has been assigned to you on ${today}.

LEAD DETAILS:
- Dealer/Firm: ${dealerName}
- Anchor: ${anchorName}
- Contact Person: ${leadDetails["Contact Person"] || "Not provided"}
- Mobile: ${leadDetails["Mobile Number"] || "Not provided"}
- Email: ${leadDetails["Email ID"] || "Not provided"}
- City: ${leadDetails["City"] || "Not provided"}
- Pincode: ${leadDetails["Pincode"] || "Not provided"}
- Dealer Address: ${leadDetails["Dealer Address"] || "Not provided"}

Please take appropriate action on this lead at your earliest convenience. You can reply to this email with your updates or log them directly in the Lead Management System.

Required Action:
1. Contact the dealer within 48 hours
2. Update the status in the system
3. Provide regular feedback on progress

Thank you for your prompt attention to this matter.

Regards,
SCF Lead Management System
`;
}

/**
 * Function to get all emails for a specific RM
 * @param rmAdid RM's ADID or a part of the email address
 */
export async function getRMInboxEmails(rmAdid: string) {
  try {
    console.log(`[getRMInboxEmails] Getting emails for RM: ${rmAdid}`);
    
    // Get all leads assigned to this RM safely
    const processedLeads = await safeDbOperation(
      () => db.processed_leads
        .where('assignedRmAdid')
        .equals(rmAdid)
        .toArray(),
      []
    );
    
    console.log(`[getRMInboxEmails] Found ${processedLeads.length} processed leads assigned to RM`);
    
    // Array to hold all lead communications
    const allCommunications = [];
    
    // Get communications for each lead safely
    for (const lead of processedLeads) {
      try {
        // Get communications for this lead safely
        const communications = await safeDbOperation(
          () => db.lead_communications
            .where('processedLeadId')
            .equals(lead.id)
            .toArray(),
          []
        );
        
        // Add to the all communications array
        allCommunications.push(...communications);
      } catch (error) {
        console.error(`[getRMInboxEmails] Error getting communications for lead ${lead.id}:`, error);
      }
    }
    
    // Get old-style communications assigned directly to RM email
    try {
      // Try to find RM email from RMBranch table safely
      let rmEmail = null;
      const rmRecord = await safeDbOperation(
        () => db.rm_branch
          .where('rmId')
          .equals(rmAdid)
          .first(),
        null
      );
      
      if (rmRecord) {
        // Use the RM name or ID to construct an email
        rmEmail = `${rmRecord.rmName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      } else {
        // Default to a pattern based on RM ID
        rmEmail = `${rmAdid.toLowerCase()}@example.com`;
      }
      
      // Get old-style communications safely
      const oldStyleComms = await safeDbOperation(
        () => db.lead_communications
          .where('rmEmail')
          .equals(rmEmail)
          .toArray(),
        []
      );
      
      // Add to the all communications array
      allCommunications.push(...oldStyleComms);
    } catch (error) {
      console.error('[getRMInboxEmails] Error getting old-style communications:', error);
    }
    
    // Sort all communications by timestamp (newest first)
    allCommunications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return allCommunications;
  } catch (error) {
    console.error('[getRMInboxEmails] Error getting RM inbox emails:', error);
    return [];
  }
} 

/**
 * Generate a simulated email content for PSM sending a lead back to RM
 */
export function generatePSMSendBackToRMEmail(
  psmNotes: string,
  leadDetails: Record<string, any>,
  rmName: string,
  psmName: string = "PSM",
  dealerName: string = "Unknown Dealer",
  anchorName: string = "Unknown Anchor"
): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Extract dealer and anchor name from leadDetails if available
  const actualDealerName = dealerName || leadDetails["Name of the Firm"] || "Unknown Dealer";
  const actualAnchorName = anchorName || leadDetails["Anchor Name"] || "Unknown Anchor";
  
  return `
Subject: Lead Sent Back to RM - ${actualDealerName} with ${actualAnchorName}

Dear ${rmName},

PSM ${psmName} has sent a lead back to you on ${today}.

LEAD DETAILS:
- Dealer/Firm: ${actualDealerName}
- Anchor: ${actualAnchorName}
- Contact Person: ${leadDetails["Contact Person"] || "Not provided"}
- Mobile: ${leadDetails["Mobile Number"] || "Not provided"}
- Email: ${leadDetails["Email ID"] || "Not provided"}
- City: ${leadDetails["City"] || "Not provided"}
- Pincode: ${leadDetails["Pincode"] || "Not provided"}

PSM NOTES:
${psmNotes}

Please take appropriate action on this lead at your earliest convenience.

Regards,
SCF Lead Management System
`;
}

/**
 * Safely handle a new lead assignment for Smartfin workflow
 * This is a wrapper around handleNewLeadAssignment that handles potential undefined values
 */
export async function safeHandleNewLeadAssignment(
  processedLeadId: string,
  rmAdid: string | null | undefined,
  psmAdid: string | null | undefined
): Promise<boolean> {
  try {
    if (!rmAdid) {
      console.error('Missing RM ADID for lead assignment');
      return false;
    }
    
    // Get the RM's email
    const rmEmail = await getEmailFromRmAdid(rmAdid);
    
    // Call the handleNewLeadAssignment function with safe parameters
    await handleNewLeadAssignment(
      processedLeadId,
      rmAdid,
      rmEmail,
      psmAdid || undefined
    );
    
    return true;
  } catch (error) {
    console.error('Error in safe lead assignment:', error);
    return false;
  }
}

/**
 * Function to get the next available Smartfin numeric value
 * Queries all existing smartfinLeadId values and returns the next sequential number
 */
export async function getNextSmartfinNumericValue(): Promise<number> {
  try {
    // Get all processed leads with smartfinLeadId values
    const allLeads = await db.processed_leads
      .where('smartfinLeadId')
      .above('') // Only get leads with non-empty smartfinLeadId
      .toArray();
    
    console.log(`Found ${allLeads.length} leads with existing Smartfin IDs`);
    
    if (allLeads.length === 0) {
      // No existing Smartfin IDs, start from 1
      console.log('No existing Smartfin IDs found, starting from 1');
      return 1;
    }
    
    // Extract numeric values from existing Smartfin IDs
    const numericValues: number[] = [];
    
    for (const lead of allLeads) {
      if (lead.smartfinLeadId && lead.smartfinLeadId.startsWith('DEALER')) {
        // Extract the 6-digit numeric part (e.g., from "DEALER000123" extract 123)
        const numericPart = lead.smartfinLeadId.substring(6); // Remove "DEALER" prefix
        const numericValue = parseInt(numericPart, 10);
        
        if (!isNaN(numericValue)) {
          numericValues.push(numericValue);
        }
      }
    }
    
    if (numericValues.length === 0) {
      // No valid numeric values found, start from 1
      console.log('No valid numeric Smartfin IDs found, starting from 1');
      return 1;
    }
    
    // Find the maximum value and return the next one
    const maxValue = Math.max(...numericValues);
    const nextValue = maxValue + 1;
    
    console.log(`Maximum existing Smartfin numeric value: ${maxValue}, next value: ${nextValue}`);
    return nextValue;
    
  } catch (error) {
    console.error('Error getting next Smartfin numeric value:', error);
    // Return 1 as fallback in case of error
    return 1;
  }
}

/**
 * Function to format a numeric value into a Smartfin Lead ID
 * Takes a numeric value and formats it as "DEALER" + 6-digit padded number
 */
export function formatSmartfinLeadId(numericValue: number): string {
  // Pad the numeric value to 6 digits with leading zeros
  const paddedNumber = numericValue.toString().padStart(6, '0');
  
  // Prepend the "DEALER" prefix
  const smartfinLeadId = `DEALER${paddedNumber}`;
  
  console.log(`Formatted Smartfin Lead ID: ${smartfinLeadId} from numeric value: ${numericValue}`);
  return smartfinLeadId;
} 