
**A. Deleting the "AI Rules" Screen**

1.  **Delete the page file for "AI Rules"**:
    *   Remove the file: `app/(dashboard)/configuration/ai-rules/page.tsx`.
    *   *Files impacted*:
        *   `app/(dashboard)/configuration/ai-rules/page.tsx` (deleted)

2.  **Remove the "AI Rules" link from the sidebar navigation**:
    *   Edit `components/SCFleadmanagement/sidebar.tsx`.
    *   Locate the `NavItem` component that links to `/configuration/ai-rules`. It looks like this:
        ```tsx
        <NavItem href="/configuration/ai-rules" icon={Sparkles}>
          AI Rules
        </NavItem>
        ```
    *   Delete this `NavItem` entry.
    *   *Files impacted*:
        *   `components/SCFleadmanagement/sidebar.tsx`

**B. Deleting the "Escalation Rules" Screen**

1.  **Delete the page file for "Escalation Rules"**:
    *   Remove the file: `app/(dashboard)/configuration/escalation-rules/page.tsx`.
    *   *Files impacted*:
        *   `app/(dashboard)/configuration/escalation-rules/page.tsx` (deleted)

2.  **Remove the "Escalation Rules" link from the sidebar navigation**:
    *   Edit `components/SCFleadmanagement/sidebar.tsx`.
    *   Locate the `NavItem` component that links to `/configuration/escalation-rules`. It looks like this:
        ```tsx
        <NavItem href="/configuration/escalation-rules" icon={Settings}>
          Escalation Rules
        </NavItem>
        ```
    *   Delete this `NavItem` entry.
    *   *Files impacted*:
        *   `components/SCFleadmanagement/sidebar.tsx`

**C. Directory Cleanup**

1.  **Remove the `configuration` directory if it becomes empty**:
    *   After deleting `ai-rules/page.tsx` and `escalation-rules/page.tsx`, the `app/(dashboard)/configuration/` directory structure will be:
        ```
        app/(dashboard)/configuration/
          ai-rules/      (empty after page.tsx deletion)
          escalation-rules/ (empty after page.tsx deletion)
        ```
    *   Delete the empty `ai-rules` sub-directory.
    *   Delete the empty `escalation-rules` sub-directory.
    *   If the `app/(dashboard)/configuration/` directory itself becomes empty as a result, delete it as well.
    *   *Files impacted*:
        *   `app/(dashboard)/configuration/ai-rules/` (directory and contents deleted)
        *   `app/(dashboard)/configuration/escalation-rules/` (directory and contents deleted)
        *   Potentially `app/(dashboard)/configuration/` (directory deleted if empty)

**D. Dependency and Schema Review (Confirmation)**

1.  **"AI Rules" Screen (`app/(dashboard)/configuration/ai-rules/page.tsx`)**:
    *   The `AIRule` interface and its state management (`useState<AIRule[]>`) are local to this file. Deleting the file removes these.
    *   This screen appears to be a UI placeholder or a feature not yet fully integrated, as there's no indication of these rules being saved to or loaded from a backend or database.
    *   The existing `lib/ai-service.ts` focuses on analyzing RM replies and uses hardcoded prompts. It does not seem to consume the rules defined on this UI screen. Therefore, deleting this screen should not impact `lib/ai-service.ts`.
    *   No specific database schema in `lib/db.ts` directly corresponds to storing the `AIRule` structure defined on this page. The `ai_prompts_master` table has a different structure.

2.  **"Escalation Rules" Screen (`app/(dashboard)/configuration/escalation-rules/page.tsx`)**:
    *   The `EscalationRule` interface and its state management (`useState<EscalationRule[]>`) are local to this file. Deleting the file removes these.
    *   This screen also appears to be a UI placeholder. The actual automated lead escalation logic is implemented in `lib/lead-escalation.ts` and uses a hardcoded `ESCALATION_CONFIG`.
    *   The `Escalation_Logic.md` document confirms that the current automated escalation is driven by `ESCALATION_CONFIG` and does not consume rules from this UI page.
    *   Deleting this UI screen will not affect the existing automated lead escalation functionality.
    *   No specific database schema in `lib/db.ts` directly corresponds to storing the `EscalationRule` structure defined on this page.

**E. Configuration or Database Migrations**

*   No database schema changes or migrations are required as these screens appear to be UI-only features with local state management, not yet integrated with backend persistence for their specific rule configurations.
*   No environment variable configurations seem to be exclusively tied to these UI rule definition screens.
