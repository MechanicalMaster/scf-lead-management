**Planning Phase:**

**A. Implementation Plan**

1.  **Define Email Template Content and Seed Data (`lib/dbUtils.ts`):**
    *   Modify the `initializeDBIfEmpty` function.
    *   For the `email_template_master` table, replace the existing sample data with the new, detailed email templates. Each template will be an `EmailTemplateMaster` object.
    *   **Templates to create:**
        *   **Lead Assignment Email:**
            *   `templateName`: "Lead Assignment Email"
            *   `description`: "Email sent to RM when a new lead is assigned."
            *   `subject`: "New Lead Assigned: {{Lead.DealerName}} - {{Lead.AnchorName}}"
            *   `body`: (Detailed HTML/text body with placeholders like `{{Lead.RMEmail}}`, `{{Lead.DealerName}}`, `{{Lead.AnchorName}}`, `{{Lead.ContactPerson}}`, `{{Lead.ContactMobile}}`, `{{Lead.ContactEmail}}`, `{{Lead.City}}`, `{{Lead.Pincode}}`, `{{Lead.Address}}`, `{{CurrentDate}}`)
            *   `toRecipients`: [`"{{Lead.RMEmail}}"`]
            *   `ccRecipients`: [`"{{Lead.CBLEmail}}"`, `"{{Lead.RBLEmail}}"`]
            *   `category`: "Assignment"
            *   `isActive`: `true`
        *   **Lead Reminder Email:**
            *   `templateName`: "Lead Reminder Email"
            *   `description`: "Reminder email for pending action on a lead."
            *   `subject`: "REMINDER: Action Required on Lead {{Lead.ID}} - {{Lead.DealerName}}"
            *   `body`: (HTML/text body with placeholders like `{{Lead.RMEmail}}`, `{{Lead.DealerName}}`, `{{Lead.AnchorName}}`, `{{Lead.DaysSinceAssignment}}`, `{{Lead.ID}}`)
            *   `toRecipients`: [`"{{Lead.RMEmail}}"`]
            *   `ccRecipients`: [`"{{Lead.CBLEmail}}"`]
            *   `category`: "Reminder"
            *   `isActive`: `true`
        *   **Lead Escalation Summary Email (CBL/RBL):**
            *   `templateName`: "Lead Escalation Summary (CBL/RBL)"
            *   `description`: "Summary of escalated leads for CBLs/RBLs regarding RMs under them."
            *   `subject`: "Lead Escalation Summary - RMs Requiring Action - {{CurrentDate}}"
            *   `body`: (HTML/text body listing RMs and their overdue leads. Placeholders: `{{ManagerName}}`, `{{ReportingPeriod}}`, Loop through `{{EscalatedRMsList}}` where each item has `{{RMName}}` and a sub-list of `{{OverdueLeadsList}}` with `{{Lead.ID}}`, `{{Lead.DealerName}}`, `{{Lead.AnchorName}}`, `{{Lead.DaysOverdue}}`)
            *   `toRecipients`: [`"{{ManagerEmail}}"`]
            *   `ccRecipients`: []
            *   `category`: "Escalation"
            *   `isActive`: `true`
        *   **ZH Summary Email:**
            *   `templateName`: "ZH Escalation Summary Email"
            *   `description`: "Summary of escalated leads for Zonal Heads."
            *   `subject`: "Zonal Lead Escalation Summary - {{CurrentDate}}"
            *   `body`: (HTML/text body, similar to CBL/RBL summary but potentially aggregated at a higher level. Placeholders: `{{ZHName}}`, `{{ReportingPeriod}}`, Loop through `{{ZoneEscalationSummaryList}}` with `{{RBLNameOrCBLName}}` and their respective RM/Lead details.)
            *   `toRecipients`: [`"{{ZHEmail}}"`]
            *   `ccRecipients`: []
            *   `category`: "Escalation"
            *   `isActive`: `true`
        *   **PSM Reply Email (PSM sends back to RM):**
            *   `templateName`: "PSM Lead Reassignment to RM"
            *   `description`: "Email sent to RM when PSM reassigns/sends back a lead."
            *   `subject`: "Lead {{Lead.ID}} Reassigned by PSM: {{Lead.DealerName}}"
            *   `body`: (HTML/text body. Placeholders: `{{RMName}}`, `{{PSMName}}`, `{{Lead.ID}}`, `{{Lead.DealerName}}`, `{{Lead.AnchorName}}`, `{{PSMNotes}}`, `{{CurrentDate}}`)
            *   `toRecipients`: [`"{{Lead.RMEmail}}"`]
            *   `ccRecipients`: [`"{{Lead.PSMEmail}}"`]
            *   `category`: "PSM Action"
            *   `isActive`: `true`
        *   **Daily Summary Email (Senior Stakeholder):**
            *   `templateName`: "Daily Lead Management Summary"
            *   `description`: "Daily summary of platform actions for senior stakeholders."
            *   `subject`: "Daily SCF Lead Management Summary - {{CurrentDate}}"
            *   `body`: (HTML/text body with key metrics. Placeholders: `{{CurrentDate}}`, `{{NewLeadsToday}}`, `{{LeadsProcessedToday}}`, `{{PendingEscalations}}`, `{{ClosedLeadsToday}}`)
            *   `toRecipients`: [`"{{StakeholderEmailList}}"`] // Could be a list of emails or a distribution group placeholder
            *   `ccRecipients`: []
            *   `category`: "Summary Report"
            *   `isActive`: `true`
        *   **Weekly Summary Email (Senior Stakeholder):**
            *   `templateName`: "Weekly Lead Management Summary"
            *   `description`: "Weekly summary of platform actions for senior stakeholders."
            *   `subject`: "Weekly SCF Lead Management Summary - Week of {{WeekStartDate}}"
            *   `body`: (HTML/text body with weekly metrics and trends. Placeholders: `{{WeekStartDate}}`, `{{WeekEndDate}}`, `{{TotalNewLeadsWeekly}}`, `{{TotalProcessedLeadsWeekly}}`, `{{ConversionRateWeekly}}`, `{{AverageLeadAgeWeekly}}`)
            *   `toRecipients`: [`"{{StakeholderEmailList}}"`]
            *   `ccRecipients`: []
            *   `category`: "Summary Report"
            *   `isActive`: `true`
    *   Ensure each template object includes `id` (unique string), `createdAt`, and `updatedAt` (ISO strings).

2.  **Modify MasterLayout Component (`components/SCFleadmanagement/masters/master-layout.tsx`):**
    *   Add a new optional prop `hideUploadTab?: boolean` to the `MasterLayoutProps` interface.
    *   In the `TabsList` rendering, conditionally render the "Upload New Data" `TabsTrigger` based on `!hideUploadTab`.
        ```tsx
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            View Master Data
          </TabsTrigger>
          {!hideUploadTab && ( // Conditional rendering
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload New Data
            </TabsTrigger>
          )}
        </TabsList>
        ```
    *   If `hideUploadTab` is true, the grid for `TabsList` might need to be adjusted (e.g., `grid-cols-1` if only one tab remains, or ensure it still looks good). A simple approach is to keep `grid-cols-2` and let the CSS handle the single item if the second is hidden, or dynamically adjust the class. For simplicity, let's assume the current CSS for `TabsList` will adapt.

3.  **Update EmailTemplateMasterComponent (`components/SCFleadmanagement/masters/email-template-master.tsx`):**
    *   When rendering the `MasterLayout`, pass the new prop: `<MasterLayout ... hideUploadTab={true} ... >`.

4.  **Add Email Template Master Headers to Constants (`lib/constants.ts`):**
    *   Add `EMAIL_TEMPLATE_MASTER_HEADERS` to the constants file, which will define the expected headers if an upload functionality were ever to be added for this specific master or for consistency in `STORE_FIELDS`.
        ```typescript
        export const EMAIL_TEMPLATE_MASTER_HEADERS = [
          "Template Name",
          "Description",
          "Subject",
          "Body",
          "To Recipients", // Expect comma-separated string if from Excel
          "CC Recipients", // Expect comma-separated string if from Excel
          "Category",
          "Is Active"
        ];
        ```
    *   Update `STORE_FIELDS` in `lib/db.ts` to include these headers for `email_template_master`.

**B. File Impacts**

1.  **`lib/dbUtils.ts`** (or **`lib/db-init.ts`**):
    *   `initializeDBIfEmpty`: Major updates to include the specific email template data.
2.  **`components/SCFleadmanagement/masters/master-layout.tsx`**:
    *   `MasterLayoutProps` interface updated with `hideUploadTab`.
    *   Conditional rendering logic for the "Upload New Data" `TabsTrigger`.
3.  **`components/SCFleadmanagement/masters/email-template-master.tsx`**:
    *   Pass `hideUploadTab={true}` to the `MasterLayout` component.
4.  **`lib/constants.ts`**:
    *   Added `EMAIL_TEMPLATE_MASTER_HEADERS`.
5.  **`lib/db.ts`**:
    *   Updated `STORE_FIELDS` for `email_template_master` to use `EMAIL_TEMPLATE_MASTER_HEADERS`.

**C. Configuration or Database Migrations**

1.  **Database Schema (Dexie):**
    *   No schema *changes* are needed as the `email_template_master` table was already defined in version 12. The primary change is populating it with specific data.
    *   If the `id` for sample data was previously numeric or based on `Date.now()`, it should be updated to a unique string (like `template-001`) for the new templates to ensure consistency and prevent potential ID collisions if `Date.now()` was used for multiple quick additions. The current schema uses `id: string`, so this is fine.

This plan ensures the email templates are seeded into the database and the UI for Email Template Master correctly reflects its view-only nature by hiding the upload tab.