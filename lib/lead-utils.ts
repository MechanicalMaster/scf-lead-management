import db from './db';
import { safeDbOperation } from './db-init';

/**
 * Function to get an RM's email address from their ADID
 * Checks hierarchy_master and rm_branch tables
 */
export async function getEmailFromRmAdid(rmAdid: string): Promise<string> {
  try {
    // First check the hierarchy_master table
    const hierarchyRecord = await db.hierarchy_master
      .where('empAdid')
      .equals(rmAdid)
      .or('rblAdid')
      .equals(rmAdid)
      .first();
    
    if (hierarchyRecord?.yesEmail) {
      return hierarchyRecord.yesEmail;
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