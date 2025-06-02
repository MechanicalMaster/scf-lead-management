Okay, I've analyzed the codebase, particularly focusing on the new `lib/lead-escalation.ts` and related files.

The current RM escalation logic is primarily driven by the `lib/lead-escalation.ts` file, which works in conjunction with `lib/task-scheduler.ts` to periodically check and process leads for escalation. The configuration for timeframes is currently hardcoded in `ESCALATION_CONFIG` within `lib/lead-escalation.ts`, and the UI for customizing these rules (`app/(dashboard)/configuration/escalation-rules/page.tsx`) does not yet seem to directly feed into this specific automated escalation flow.

Here's the breakdown of the current RM lead escalation logic:

**RM Escalation Logic Flow**

The process is designed to handle leads that are currently assigned to an RM and are pending action. It follows a multi-level approach based on inactivity duration.

1.  **Identify Leads for Escalation Check:**
    *   The `runEscalationProcess()` function (typically triggered by the task scheduler or manually) fetches all `LeadWorkflowState` records where the `currentStage` is *not* 'Dropped' or 'ClosedLead'. This targets active leads.

2.  **Check Escalation Status for Each Lead (`checkEscalationStatus` function):**
    *   For each active lead assigned to an RM (where `currentAssigneeType` is 'RM' and `currentStage` is not already 'PSM_REVIEW_PENDING'):
        *   Calculate `daysSinceLastUpdate`: This is the number of calendar days (not working days, currently) since the `lastStageChangeTimestamp`.
        *   The function then determines if a reminder or an escalation is due based on the lead's current `escalationLevel` and the `daysSinceLastUpdate` compared against thresholds in `ESCALATION_CONFIG`.
            *   **Reminder Due (Level 0 -> Reminder):**
                *   If `escalationLevel` is 0 (no prior escalation for this RM action period).
                *   And `daysSinceLastUpdate` >= `ESCALATION_CONFIG.FIRST_REMINDER_DAYS`.
                *   And `daysSinceLastUpdate` < `ESCALATION_CONFIG.ESCALATION_LEVEL_1_DAYS`.
                *   Then `requiresReminder` is true.
            *   **Escalation to Level 1 Due (Level 0 -> Level 1):**
                *   If `escalationLevel` is 0.
                *   And `daysSinceLastUpdate` >= `ESCALATION_CONFIG.ESCALATION_LEVEL_1_DAYS`.
                *   Then `requiresEscalation` is true, `newEscalationLevel` becomes 1, and `newStage` becomes `WORKFLOW_STAGES.RM_ESCALATION_1`.
            *   **Escalation to Level 2 Due (Level 1 -> Level 2):**
                *   If `escalationLevel` is 1.
                *   And `daysSinceLastUpdate` >= `ESCALATION_CONFIG.ESCALATION_LEVEL_2_DAYS` (note: this duration is *since the last stage change*, which would have been the change to Level 1).
                *   Then `requiresEscalation` is true, `newEscalationLevel` becomes 2, and `newStage` becomes `WORKFLOW_STAGES.RM_ESCALATION_2`.
            *   **Escalation to PSM Due (Level 2 -> PSM Review):**
                *   If `escalationLevel` is 2.
                *   And `daysSinceLastUpdate` >= `ESCALATION_CONFIG.ESCALATION_TO_PSM_DAYS` (again, since the change to Level 2).
                *   Then `requiresEscalation` is true, `newEscalationLevel` becomes 3 (or implies PSM action), and `newStage` becomes `WORKFLOW_STAGES.PSM_REVIEW_PENDING`.

3.  **Process Escalation/Reminder (`processLeadEscalation` function):**
    *   If `checkEscalationStatus` indicates an action is needed:
        *   **If `requiresReminder` is true (and `requiresEscalation` is false):**
            *   A `LeadCommunication` record is created with `communicationType: 'SystemReminderEmail'`, titled "Follow-up Reminder".
            *   The description indicates it's a reminder due to inactivity.
            *   The recipient is the `currentAssigneeAdid` (the RM).
            *   The `LeadWorkflowState`'s `nextFollowUpTimestamp` is updated (currently to 1 day from now), but `escalationLevel` and `currentStage` are NOT changed.
        *   **If `requiresEscalation` is true:**
            *   A `LeadCommunication` record is created with `communicationType: 'SystemFollowUpEmail'`.
            *   The `title` and `recipient` (and potential CCs) vary by the `newEscalationLevel`:
                *   **Level 1 (`newStage` = `RM_ESCALATION_1`):**
                    *   Title: "Lead Escalation - Level 1".
                    *   Recipient: The RM (`workflowState.currentAssigneeAdid`).
                    *   (CC logic to manager is not fully implemented with email lookup in the current code, but a placeholder for RBL ADID might be constructed).
                *   **Level 2 (`newStage` = `RM_ESCALATION_2`):**
                    *   Title: "Lead Escalation - Level 2".
                    *   Recipient: The RM.
                    *   CC: Attempts to find RM's RBL from `HierarchyMaster` and form an example email for CC.
                *   **Level 3 (PSM Escalation, `newStage` = `PSM_REVIEW_PENDING`):**
                    *   Title: "Lead Escalated to PSM".
                    *   Recipient: The PSM (`workflowState.psmAdid`).
                    *   CC: The original RM.
            *   The `LeadWorkflowState` is updated:
                *   `escalationLevel` is set to `escalationStatus.newEscalationLevel`.
                *   `currentStage` is set to `escalationStatus.newStage`.
                *   `lastStageChangeTimestamp` is set to now.
                *   `nextFollowUpTimestamp` is updated (currently to 1 day from now).
                *   If escalating to PSM, `currentAssigneeType` becomes 'PSM' and `currentAssigneeAdid` becomes `workflowState.psmAdid`.

**Key Points of Current Implementation:**

*   **Hardcoded Thresholds:** Timeframes (`FIRST_REMINDER_DAYS`, `ESCALATION_LEVEL_1_DAYS`, etc.) are defined in `ESCALATION_CONFIG` within `lib/lead-escalation.ts` and are not yet driven by the UI on the "Escalation Rules" page.
*   **Calendar Days, Not Working Days:** The logic uses `differenceInDays` which counts calendar days. The "working day" and "holiday master" logic from your feature request is not yet integrated into this automated escalation process.
*   **Sequential Escalation:** The system follows a defined sequence: RM Reminder -> Level 1 -> Level 2 -> PSM.
*   **Communication Logging:** Each reminder and escalation step generates a `LeadCommunication` record.
*   **State Update:** `LeadWorkflowState` is updated to reflect the new stage and escalation level.
*   **Trigger Mechanism:** The entire process is designed to be run by `runEscalationProcess()`, which is scheduled by `node-schedule` in `lib/task-scheduler.ts` (intended for server-side execution, or can be run manually via `runLeadEscalationManually`). The `app/api/init/route.ts` calls `initializeApp` which in turn calls `initializeScheduledTasks`.

**Visualization: Flowchart for Current RM Escalation**

```mermaid
graph TD
    A[Start: runEscalationProcess()] --> B{For each active LeadWorkflowState (not Dropped/Closed)};
    B --> C{Is currentAssigneeType === 'RM' AND currentStage !== 'PSM_REVIEW_PENDING'?};
    C -- No --> B;
    C -- Yes --> D[Call checkEscalationStatus(workflowState)];
    D --> E{Requires Reminder OR Escalation?};
    E -- No --> B;
    E -- Yes --> F[Call processLeadEscalation(leadId, workflowState)];

    subgraph processLeadEscalation
        F --> G{Requires Reminder AND NOT Requires Escalation?};
        G -- Yes --> H[Create 'SystemReminderEmail' Communication to RM];
        H --> I[Update nextFollowUpTimestamp in LeadWorkflowState];
        I --> X[End Process for this Lead];

        G -- No (Requires Escalation) --> J{New Escalation Level?};
        J -- Level 1 --> K1[Create Escalation Email (L1) to RM];
        K1 --> L[Update LeadWorkflowState: escalationLevel=1, currentStage='RM_Escalation1', timestamps];
        L --> X;
        J -- Level 2 --> K2[Create Escalation Email (L2) to RM (CC RBL - attempted)];
        K2 --> M[Update LeadWorkflowState: escalationLevel=2, currentStage='RM_Escalation2', timestamps];
        M --> X;
        J -- Level 3 (PSM) --> K3[Create Escalation Email to PSM (CC RM)];
        K3 --> N[Update LeadWorkflowState: escalationLevel=3, currentStage='PSM_REVIEW_PENDING', currentAssignee=PSM, timestamps];
        N --> X;
    end
    X --> B;
```
