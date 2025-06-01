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
  ERR_ANCHOR_PROG_REQ: { code: "ERR_ANCHOR_PROG_REQ", description: "Anchor and Program must be selected.", module: "Lead Upload", severity: "Error" }
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