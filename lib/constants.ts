// lib/constants.ts
// Constants used throughout the application

export const LEAD_TEMPLATE_HEADERS = [
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

// Common error codes for RM assignment
export const ERROR_CODES = {
  ERR_HDR_INV: { code: "ERR_HDR_INV", description: "Invalid file headers.", module: "Lead Upload", severity: "Error" },
  ERR_PIN_NF: { code: "ERR_PIN_NF", description: "Pincode not found.", module: "RM Assignment", severity: "Error" },
  ERR_BR_NMAP: { code: "ERR_BR_NMAP", description: "Branch not mapped to RM.", module: "RM Assignment", severity: "Error" },
  ERR_RM_NBR: { code: "ERR_RM_NBR", description: "No RM for Branch.", module: "RM Assignment", severity: "Error" },
  INFO_RM_MANUAL: { code: "INFO_RM_MANUAL", description: "RM assigned from Excel.", module: "RM Assignment", severity: "Info" },
  INFO_RM_AUTO: { code: "INFO_RM_AUTO", description: "RM assigned automatically.", module: "RM Assignment", severity: "Info" },
  ERR_ANCHOR_PROG_REQ: { code: "ERR_ANCHOR_PROG_REQ", description: "Anchor and Program must be selected.", module: "Lead Upload", severity: "Error" },
  // New error codes for segment-based RM assignment
  ERR_ANCHOR_SEG_NF: { code: "ERR_ANCHOR_SEG_NF", description: "Anchor Segment Not Found.", module: "RM Assignment", severity: "Error" },
  ERR_RM_NSEG_ACT: { code: "ERR_RM_NSEG_ACT", description: "No Active RM for Segment in Branch.", module: "RM Assignment", severity: "Error" },
  INFO_RM_SEG_DIRECT: { code: "INFO_RM_SEG_DIRECT", description: "RM assigned automatically based on segment (direct).", module: "RM Assignment", severity: "Info" },
  INFO_RM_SEG_RR: { code: "INFO_RM_SEG_RR", description: "RM assigned automatically based on segment (round-robin).", module: "RM Assignment", severity: "Info" }
};

// Lead Workflow Stages
export const WORKFLOW_STAGES = {
  // RM stages
  RM_ASSIGNMENT_EMAIL_PENDING: 'RM_AssignmentEmailPending',
  RM_AWAITING_REPLY: 'RM_AwaitingReply',
  RM_REASSIGNMENT_EMAIL_PENDING: 'RM_ReassignmentEmailPending',
  
  // Escalation stages
  RM_ESCALATION_1: 'RM_Escalation1',
  RM_ESCALATION_2: 'RM_Escalation2',
  
  // PSM stages
  PSM_REVIEW_PENDING: 'PSM_ReviewPending',
  PSM_ASSIGNED: 'PSM_Assigned',
  PSM_AWAITING_ACTION: 'PSM_AwaitingAction',
  
  // Other stages
  ADMIN_REVIEW_PENDING: 'AdminReviewPending',
  DROPPED: 'Dropped',
  CLOSED: 'ClosedLead'
};

// Template headers for Smartfin Status Update
export const SMARTFIN_UPDATE_TEMPLATE_HEADERS = [
  "Application No",
  "Created Date",
  "Firm Name",
  "Application Type",
  "Status",
  "Branch",
  "Requested Amount",
  "Sanctioned Amount",
  "Sanction Date",
  "Program Mapped Date",
  "RM Name",
  "RM TAT",
  "CPA Name",
  "CPA TAT",
  "CM Name",
  "CM TAT",
  "Approval Requested Date",
  "Approval TAT",
  "Total TAT"
];

// Template headers for Email Template Master
export const EMAIL_TEMPLATE_MASTER_HEADERS = [
  "Template Name",
  "Description",
  "Subject",
  "Body",
  "To Recipients",
  "CC Recipients",
  "Category",
  "Is Active"
]; 