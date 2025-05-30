**A. Implementation Plan:**

1.  **Environment Variable Setup for API Key:**
    *   Instruct users to create or update their `.env.local` file in the project root.
    *   Add the OpenAI API key to this file: `NEXT_PUBLIC_OPENAI_API_KEY="your_openai_api_key_here"`.
    *   *(Note: Prefixing with `NEXT_PUBLIC_` makes the key accessible on the client-side. This is suitable for prototyping but be mindful of security implications for production.)*

2.  **Refactor AI Service (`lib/ai-service.ts`):**
    *   Remove the `getActiveAIConfig` function.
    *   Define constants at the top of the file for the hardcoded prompts, default model, and API endpoint:
        *   `PROMPT_SUMMARY_TEMPLATE = "Please provide a concise 2-3 word summary of this RM reply: {reply_text}"`
        *   `PROMPT_NEXT_ACTION_TEMPLATE = "Based on this RM reply, determine if the dealer is interested in a follow-up or not. Reply with ONLY \"FollowUp\" if follow-up is needed, or \"Dealer Not Interested\" if the dealer is expressing disinterest or rejection: {reply_text}"`
        *   `DEFAULT_MODEL = "gpt-3.5-turbo"`
        *   `API_ENDPOINT = "https://api.openai.com/v1"`
    *   In the `getAiAnalysisForReply` function:
        *   Retrieve the API key using `process.env.NEXT_PUBLIC_OPENAI_API_KEY`.
        *   Add a log statement for the API key found (or if it's missing).
        *   If the API key is missing, log a warning and return `null` early.
        *   Initialize the OpenAI client using the API key from the environment variable and the hardcoded `API_ENDPOINT`.
        *   Use the hardcoded `PROMPT_SUMMARY_TEMPLATE` and `PROMPT_NEXT_ACTION_TEMPLATE`, replacing `{reply_text}` as currently done.
        *   Use the hardcoded `DEFAULT_MODEL` for API calls.
        *   **Add comprehensive logging:**
            *   Log the start of the `getAiAnalysisForReply` function with `replyText` (or its length for brevity).
            *   Log the prepared `summaryPrompt` and `nextActionPrompt`.
            *   Log before making the API call to OpenAI for summary.
            *   Log the raw or key parts of the `summaryResponse` and any usage data.
            *   Log before making the API call to OpenAI for next action.
            *   Log the raw or key parts of the `nextActionResponse` and any usage data.
            *   Log the extracted `summary` and `nextActionPrediction`.
            *   Log the `totalTokens` consumed.
            *   Log any errors encountered during API calls or data processing within a try-catch block.

3.  **Database Schema Update (`lib/db.ts`):**
    *   Remove the `AIPromptsMaster` interface definition.
    *   In the `SCFLeadManagementDB` class constructor:
        *   Increment the database version (e.g., if current is 6, change to 7).
        *   In the new version definition, list all existing tables *except* `ai_prompts_master`. To explicitly remove it, set `ai_prompts_master: null` in the stores definition for the new version.
            Example for new version 7 (assuming current latest is 6):
            ```typescript
            this.version(7).stores({
              anchor_master: 'id, anchorname, programname, anchoruuid, programuuid, segment, PSMName, PSMADID',
              hierarchy_master: 'id, employeeName, empAdid, fullName, rblAdid, rblName, region, zhAdid, zhName',
              holiday_master: 'id, Date, HolidayType, date, name, type, description',
              pincode_branch: 'id, pincode, branchCode, branchName, city, state, region, active',
              rm_branch: 'id, rmId, rmName, branchCode, branchName, region, role, active',
              error_codes: '++id, errorCode, module, severity',
              processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode',
              lead_communications: 'id, processedLeadId, timestamp, communicationType, senderType, senderAdidOrEmail', // Ensure this matches the latest definition of lead_communications
              lead_workflow_states: 'id, processedLeadId, currentStage, currentAssigneeAdid, currentAssigneeType, nextFollowUpTimestamp, updatedAt',
              ai_prompts_master: null // This line ensures the table is removed on upgrade
            });
            ```
    *   Remove `ai_prompts_master` from the `StoreName` type and `StoreTableMap`.
    *   Remove `ai_prompts_master` from the `STORE_FIELDS` constant.

4.  **Remove AI Prompts Master UI & Logic:**
    *   Delete the file `app/masters/ai-prompts/page.tsx`.
    *   Delete the file `components/SCFleadmanagement/masters/ai-prompts-master.tsx`.
    *   In `components/SCFleadmanagement/sidebar.tsx`, remove the navigation `Link` for "AI Prompts Master".

5.  **Update Database Initialization (`lib/db-init.ts`):**
    *   Remove the `initializeAIPromptsIfEmpty` function.
    *   Remove the call to `initializeAIPromptsIfEmpty` from the `initializeDatabase` function. The version bump in `lib/db.ts` will handle the schema change.

6.  **Documentation Updates:**
    *   Update `README.md` to include instructions for setting `NEXT_PUBLIC_OPENAI_API_KEY` in `.env.local`.
    *   Review `ai.md`. This document seems to describe the plan for the feature that is now being removed/altered. It will need significant updates or be marked as partially obsolete regarding AI configuration.

**B. Affected Files:**

1.  `.env.local` (User-managed file, instructions to be provided)
2.  `lib/ai-service.ts`
3.  `lib/db.ts`
4.  `lib/db-init.ts`
5.  `components/SCFleadmanagement/sidebar.tsx`
6.  `app/masters/ai-prompts/page.tsx` (Will be deleted)
7.  `components/SCFleadmanagement/masters/ai-prompts-master.tsx` (Will be deleted)
8.  `README.md` (Or other setup documentation)
9.  `ai.md` (For review and update/archival)

**C. Configuration or Database Migrations:**

1.  **Database Migration (Dexie):**
    *   As described in Plan Step 3, increment the database version in `lib/db.ts` and update the schema definition for that new version to remove the `ai_prompts_master` table by setting its definition to `null`. This will trigger Dexie to drop the table when a user's browser loads the application with the updated code.

2.  **Environment Variable Configuration:**
    *   Users must add `NEXT_PUBLIC_OPENAI_API_KEY="THEIR_KEY"` to their `.env.local` file.