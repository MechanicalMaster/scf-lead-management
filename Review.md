**Preliminary Planning Phase (pending clarifications):**

Here's a step-by-step implementation plan:

**A. Implementation Plan:**

1.  **Update AI Service (`lib/ai-service.ts`):**
    *   Modify `AIAnalysisResult` interface to include `'Admin Review'` in `nextActionPrediction`'s possible types.
    *   Update the prompt for `PROMPT_NEXT_ACTION_TEMPLATE` (or add a new one) to instruct the AI to output "Admin Review" if it's unsure about "FollowUp" vs. "Dealer Not Interested", or if the reply indicates a wrong assignment (e.g., "This lead is not for me", "Please reassign").
    *   Adjust the logic that normalizes `nextActionRaw` to correctly identify and set `nextActionPrediction` to `'Admin Review'`.
    *   Update `mapAIDecisionToWorkflowStage` to handle the new "Admin Review" decision, mapping it to the new workflow stage (e.g., `'AdminReviewPending'`).

2.  **Update Database Schema and Related Types (`lib/db.ts`):**
    *   **`LeadWorkflowState` Interface:** No direct change needed if "Admin Review" is a new value for `currentStage`.
    *   **Dexie Schema Version:** Increment the database version in `SCFLeadManagementDB` constructor in `lib/db.ts`.
    *   **`stores` Definition:** Ensure `lead_workflow_states` and its indices are correctly defined for the new version. No new table is needed if "Admin Review" is a `currentStage`.

3.  **Update Workflow Logic (`lib/lead-workflow.ts`):**
    *   Add the new stage (e.g., `'AdminReviewPending'`) to relevant logic.
    *   Update `stageToFlagMap` to include the mapping for the new stage to its display flag (e.g., `'AdminReviewPending': 'Admin Review'`).
    *   In `createRMReplyCommunication`, if `aiDecision` is `'Admin Review'`, ensure `updates.currentStage` is set to the new "Admin Review" stage.

4.  **Create "Program Review" Page & Component:**
    *   **Routing (`app/leads/program-review/page.tsx` or similar):** Create a new route. This will likely be a client component similar to `app/rm-leads/page.tsx` or `app/psm-leads/page.tsx` that dynamically imports the main component.
    *   **Component (`components/SCFleadmanagement/program-review-leads.tsx`):**
        *   Create a new component, largely based on `components/SCFleadmanagement/rm-leads.tsx` or `psm-leads.tsx`.
        *   Data fetching logic: Fetch leads where `LeadWorkflowState.currentStage` is `'AdminReviewPending'`. Unlike RM/PSM leads, this page should show all such leads, not filtered by a specific RM or PSM.
        *   Adapt UI elements (table columns, filters, sort options) as needed. Columns like "Assigned RM", "Assigned PSM" might still be relevant to show who it was previously with or who the system thought it should go to.
        *   Ensure `EditLeadModal` is used/adapted for actions an admin can take (e.g., re-assign RM, assign to PSM, drop, change stage).

5.  **Update Sidebar (`components/SCFleadmanagement/sidebar.tsx`):**
    *   Add a new `NavItem` for "Program Review" under the "Leads" section.
    *   Ensure the `hasAccess` logic in `AuthProvider` is updated to grant access to this new page based on user role (e.g., "admin").

6.  **Update Authentication/Authorization (`components/auth-provider.tsx`):**
    *   Modify the `hasAccess` function to include permissions for the new "/program-review" route, likely for the "admin" role.

7.  **Update Lead Editing Modal (`components/SCFleadmanagement/edit-lead-modal.tsx`):**
    *   When opened for a lead from the "Program Review" page (or for a lead in "Admin Review" state):
        *   The available actions/flags in the modal might need to be different. For example, an admin might have options to:
            *   Re-assign to a new RM (this might require adding an RM selection dropdown).
            *   Assign to a PSM.
            *   Change stage to "Dropped".
            *   Send back to the original RM if the assignment was correct but AI was unsure.
        *   The `handleSave` logic will need to accommodate these new actions and update `LeadWorkflowState` accordingly.

8.  **Update UI Constants and Styling:**
    *   Add the new display flag (e.g., "Admin Review") and its corresponding color to `flagColors` in `components/SCFleadmanagement/rm-leads.tsx` and any other component that displays lead flags (like `psm-leads.tsx` and the new `program-review-leads.tsx`).

**B. Affected Files (Preliminary):**

1.  `lib/ai-service.ts`
    *   `AIAnalysisResult` interface
    *   `PROMPT_NEXT_ACTION_TEMPLATE` (or new prompt)
    *   `getAiAnalysisForReply` function (response parsing)
    *   `mapAIDecisionToWorkflowStage` function
2.  `lib/db.ts`
    *   `SCFLeadManagementDB` class (version increment, store definitions)
3.  `lib/lead-workflow.ts`
    *   `stageToFlagMap` constant
    *   `createRMReplyCommunication` function (logic for handling "Admin Review" AI decision)
    *   Potentially new functions if specific actions from "Program Review" page require unique workflow updates.
4.  `app/leads/program-review/page.tsx` (New file)
5.  `components/SCFleadmanagement/program-review-leads.tsx` (New file)
6.  `components/SCFleadmanagement/sidebar.tsx`
    *   `NavItem` additions
7.  `components/auth-provider.tsx`
    *   `hasAccess` function
8.  `components/SCFleadmanagement/edit-lead-modal.tsx`
    *   State for actions available to admin/reviewer.
    *   `handleSave` logic for new actions.
    *   UI elements for new actions (e.g., RM selection dropdown if re-assignment is an option).
9.  `components/SCFleadmanagement/rm-leads.tsx` (and `psm-leads.tsx`, new `program-review-leads.tsx`)
    *   `flagColors` constant
10. `lib/constants.ts` (If any new error codes or shared constants are needed for this feature)
11. `components/SCFleadmanagement/rm-inbox.tsx`
    *   The `submitReply` function calls `createRMReplyCommunication`, which will now use the updated AI service and workflow logic. No direct changes might be needed here unless the UI needs to reflect the possibility of "Admin Review".

**C. Configuration or Database Migrations:**

*   **Database Migration:** Dexie will handle schema changes automatically due to the version increment in `lib/db.ts`. No manual migration script is typically needed for adding new values to existing fields or new stages if they are just new string values. Existing data will remain.
*   **Environment Variables:** If the AI service changes require new configuration (e.g., different model for this specific classification), `/.env.local.example` and `.env.local` might need updates. (Unlikely for this change based on description).
