
**Revised Planning Phase:**

**a. Implementation Plan:**

1.  **Modify `RMLeads` Component (`components/SCFleadmanagement/rm-leads.tsx`):**
    *   Import necessary hooks and services: `useEffect`, `useState` from React, `useAuth` from `components/auth-provider`, `db` (Dexie instance) from `lib/db`, and interfaces like `ProcessedLead`, `LeadWorkflowState`, `HierarchyMaster` (or `RMBranch`).
    *   Add state variables to hold the fetched leads (e.g., `actualLeads`), loading status, and any errors.
    *   Implement a `useEffect` hook to fetch leads when the component mounts or the logged-in user/role changes.
        *   Inside this hook, use `useAuth` to get the current user's role (`userRole`) and ID (`user.id`).
        *   **Data Fetching Logic based on Role:**
            *   **If `userRole` is "admin":**
                *   Fetch *all* `ProcessedLead` records from IndexedDB.
            *   **If `userRole` is "rm":**
                *   Fetch `ProcessedLead` records where `assignedRmAdid` matches the logged-in RM's ID (`user.id`).
            *   If no leads are found in either case, set `actualLeads` to an empty array and potentially display a "No leads found" message in the table body.
        *   For each fetched `ProcessedLead`:
            *   Fetch the corresponding `LeadWorkflowState` record using `processedLead.id` (which is the `processedLeadId` for the workflow state).
            *   Fetch RM names: For each `ProcessedLead.assignedRmAdid` (if present), query `HierarchyMaster` table (using `empAdid`) or `RMBranch` table (using `rmId`) to get the `employeeName` (or `rmName`). Store this, perhaps as `rmDisplayName`.
        *   **Calculate Ageing Bucket:**
            *   For each lead, determine the creation timestamp. This could be `ProcessedLead.processedTimestamp` or `LeadWorkflowState.createdAt`. Let's assume `LeadWorkflowState.createdAt` is more appropriate for workflow ageing.
            *   Calculate the difference between the current date and the `createdAt` timestamp.
            *   Implement logic to categorize this difference into buckets (e.g., "0-7 days", "8-14 days", "15-30 days", "31-60 days", "60+ days"). This calculation will happen client-side during data preparation.
        *   Combine the data from `ProcessedLead`, `LeadWorkflowState`, fetched RM name, and calculated Ageing Bucket into a new data structure for `actualLeads`.
        *   Populate the `actualLeads` state.
        *   Handle loading and error states.

2.  **Update Table Rendering Logic (`components/SCFleadmanagement/rm-leads.tsx`):**
    *   Iterate over the `actualLeads` state.
    *   **Conditional Rendering for No Leads:** If `actualLeads` is empty after fetching, render a `TableRow` with a `TableCell` spanning all columns, displaying a message like "No leads assigned." or "No leads found in the system."
    *   Map fields:
        *   **Lead ID:** `processedLead.id`
        *   **Dealer Name:** `processedLead.originalData["Name of the Firm"]`
        *   **Anchor Name:** `processedLead.anchorNameSelected`
        *   **RM Name:** The fetched `rmDisplayName`. If an RM is not yet assigned or name not found, display "N/A" or `processedLead.assignedRmAdid`.
        *   **Ageing Bucket:** The calculated ageing bucket string.
        *   **Last Action Date:** `leadWorkflowState.lastCommunicationTimestamp` (formatted).
        *   **Flag:** Map `leadWorkflowState.currentStage` to a display string (e.g., using `stageToFlagMap`). Apply `flagColors`.
        *   **Last Updated (for sorting/display):** `leadWorkflowState.updatedAt` (formatted).

3.  **Update Sorting and Filtering (`components/SCFleadmanagement/rm-leads.tsx`):**
    *   Ensure `handleSort`, `filteredLeads`, and `sortedLeads` logic correctly operates on the `actualLeads` data, including the new "Ageing Bucket" and fetched "RM Name".
    *   Search should now work across all relevant fields in `actualLeads`.

4.  **Update Actions ("View Details" and "Edit Lead") (`components/SCFleadmanagement/rm-leads.tsx`):**
    *   **View Details Link:** Use `processedLead.id` for the route `/lead-details/${lead.id}`.
    *   **Edit Lead Modal:**
        *   When "Edit" is clicked, pass the relevant lead data (including `processedLead.id`, `leadWorkflowState.id`, `currentStage`) to `EditLeadModal`.
        *   Modify `EditLeadModal` (`components/SCFleadmanagement/edit-lead-modal.tsx`):
            *   Accept `leadWorkflowState.id` and the list of possible stages/flags.
            *   Initialize the modal's `flag` state with the current lead's stage (mapped to display flag).
            *   The `Select` component for "Flag" should allow RMs (or Admins editing on behalf of an RM) to select a valid next stage. This might require fetching stage transition rules or defining them. For now, assume it lists all stages, and the backend/business logic would normally validate this.
            *   `handleSave` should:
                *   Map the selected display flag back to a `currentStage` value.
                *   Update `LeadWorkflowState` in IndexedDB: `db.lead_workflow_states.update(workflowStateId, { currentStage: newStage, updatedAt: new Date().toISOString(), lastStageChangeTimestamp: new Date().toISOString() })`.
                *   Consider adding a `LeadCommunication` record for this manual stage change.
                *   Refresh the `actualLeads` list in `RMLeads` or update the specific item locally.

5.  **Define `Lead` Interface (`components/SCFleadmanagement/rm-leads.tsx`):**
    *   Update the `Lead` interface to accurately represent the structure of items in `actualLeads`, including fields like `processedLeadId`, `workflowStateId` (if needed for direct updates), `dealerName`, `anchorName`, `rmDisplayName`, `calculatedAgeingBucket`, `lastActionDate`, `displayFlag`, `currentStage` (raw stage), and `lastUpdatedTimestamp`.

6.  **Styling and UI Consistency:**
    *   Ensure `flagColors` map works with the `displayFlag`.
    *   The table should look consistent with the screenshot, handling empty states gracefully.

**b. Impacted Files:**

*   `components/SCFleadmanagement/rm-leads.tsx`: Significant changes for role-based data fetching, Ageing Bucket calculation, state management, rendering (including no-leads scenario), sorting, filtering, and action handling.
*   `components/SCFleadmanagement/edit-lead-modal.tsx`: Modifications to handle saving stage changes to `LeadWorkflowState`.
*   `lib/db.ts`: May need new helper functions if fetching/combining logic is complex, or ensure direct `db` queries/`MasterService` suffice. For RM name lookup, direct queries to `HierarchyMaster` or `RMBranch` will be needed.
*   `lib/lead-workflow.ts`: `stageToFlagMap` will be used.
*   `components/auth-provider.tsx`: No direct changes, but `useAuth()` will be crucial for role and RM ID.

**c. Configuration or Database Migrations:**

*   **No database schema migrations are required.** The "Ageing Bucket" is a calculated, transient value for display and filtering, not stored directly. The creation timestamp (`LeadWorkflowState.createdAt` or `ProcessedLead.processedTimestamp`) is assumed to exist.
*   Ensure indexes on `ProcessedLead.assignedRmAdid`, `LeadWorkflowState.processedLeadId`, `HierarchyMaster.empAdid`, and `RMBranch.rmId` are present for efficient lookups.

This revised plan addresses the admin view, the dynamic Ageing Bucket, and the no-leads scenario, keeping the UI consistent.