import db from './db';

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
      // If we have an RM record but no email, create a dummy email for demo purposes
      const rmName = rmRecord.rmName.replace(/\s+/g, '.').toLowerCase();
      return `${rmName}@example.com`;
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
export async function getRMInboxEmails(rmAdid: string): Promise<any[]> {
  try {
    console.log(`[RM Inbox] Looking up emails for RM: ${rmAdid}`);
    
    // First, get the RM's email
    const rmEmail = await getEmailFromRmAdid(rmAdid);
    console.log(`[RM Inbox] RM email address: ${rmEmail}`);
    
    // Log all lead communications for debugging
    const allComms = await db.table('lead_communications').toArray();
    console.log(`[RM Inbox] Total communications in database: ${allComms.length}`);
    allComms.forEach((comm, index) => {
      console.log(`[RM Inbox] Communication ${index+1}:`, {
        id: comm.id,
        recipientAdidOrEmail: comm.recipientAdidOrEmail || comm.rmEmail,
        processedLeadId: comm.processedLeadId || comm.leadId,
        communicationType: comm.communicationType || comm.messageType,
        senderType: comm.senderType || comm.sender
      });
    });
    
    // Search for communications where this RM is the recipient
    let communications = await db.table('lead_communications')
      .filter(comm => {
        // Check different combinations to find emails for this RM
        // Check recipient email contains the RM's email (case insensitive)
        const recipientEmailMatch = comm.recipientAdidOrEmail && 
          typeof comm.recipientAdidOrEmail === 'string' && 
          comm.recipientAdidOrEmail.toLowerCase().includes(rmEmail.toLowerCase());
        
        // Check old schema format
        const oldSchemaMatch = comm.rmEmail === rmEmail && comm.recipient === 'rm';
        
        // Check if recipient contains the ADID
        const recipientAdidMatch = comm.recipientAdidOrEmail && 
          typeof comm.recipientAdidOrEmail === 'string' && 
          comm.recipientAdidOrEmail.toLowerCase().includes(rmAdid.toLowerCase());
        
        // Check direct equality of recipientAdidOrEmail with rmAdid
        const directAdidMatch = comm.recipientAdidOrEmail === rmAdid;
        
        // Check if the sender is the RM - in case of replies
        const isSender = (comm.senderAdidOrEmail === rmEmail || 
                         (comm.sender === 'rm' && comm.rmEmail === rmEmail));
        
        // Log this communication's match details for debugging
        console.log(`[RM Inbox] Checking comm ${comm.id}:`, {
          recipientEmailMatch,
          oldSchemaMatch,
          recipientAdidMatch,
          directAdidMatch,
          isSender,
          recipientValue: comm.recipientAdidOrEmail || comm.recipient
        });
        
        // Return true if any match condition is met
        return recipientEmailMatch || oldSchemaMatch || recipientAdidMatch || directAdidMatch || isSender;
      })
      .toArray();
    
    // Sort by timestamp (newest first)
    communications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    console.log(`[RM Inbox] Found ${communications.length} emails for RM ${rmAdid} (${rmEmail})`);
    if (communications.length > 0) {
      communications.forEach((comm, i) => {
        console.log(`[RM Inbox] Found email ${i+1}:`, {
          id: comm.id,
          title: comm.title,
          timestamp: comm.timestamp
        });
      });
    }
    
    return communications;
  } catch (error) {
    console.error(`[RM Inbox] Error fetching emails for RM ${rmAdid}:`, error);
    return [];
  }
} 