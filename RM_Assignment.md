
**I. New Master: Error Codes**

1.  **Define `ErrorCodeMaster` Interface and DB Schema (`lib/db.ts`):**
    *   **File:** `lib/db.ts`
    *   **Action:**
        *   Add `ErrorCodeMaster` interface:
            ```typescript
            export interface ErrorCodeMaster {
              id: string; // Typically same as errorCode
              errorCode: string; // PK for querying
              description: string;
              module: string; // e.g., 'Lead Upload', 'RM Assignment'
              severity: 'Error' | 'Warning' | 'Info';
            }
            ```
        *   Add `error_codes` table to `SCFLeadManagementDB` class schema definition.
            *   Example: `this.version(X).stores({ ..., error_codes: '++id, errorCode, module, severity' });` (Increment `X` if needed, use `++id` for auto-incrementing primary key or `errorCode` itself if it's guaranteed unique and suitable as a PK). For simplicity, let's use `errorCode` as the primary key. So: `error_codes: 'errorCode, module, severity'`. The `id` field in the interface can be a duplicate of `errorCode` or omitted if `errorCode` is the PK. Let's make `id` the PK (auto-incrementing `++id`) and index `errorCode`. Schema: `error_codes: '++id, errorCode, module, severity'`
        *   Add `error_codes` to `StoreName` type and `StoreTableMap`.
        *   Add `error_codes` entry to `STORE_FIELDS` with headers: `id` (optional for upload if auto-gen), `errorCode`, `description`, `module`, `severity`.
2.  **Create `error-code-master.tsx` Component (`components/SCFleadmanagement/masters/`):**
    *   **File:** `components/SCFleadmanagement/masters/error-code-master.tsx`
    *   **Action:** Create a new component similar to other master components.
        *   Use `MasterLayout`, set `storeName="error_codes"`.
        *   Implement state for error codes, loading, error, pagination.
        *   Fetch and display error codes from `MasterService.getRecords('error_codes', ...)` and `MasterService.getTotalRecords('error_codes')`.
        *   Display data in a `<Table>` with columns: Error Code, Description, Module, Severity.
3.  **Add Navigation to Error Code Master:**
    *   **File:** `components/SCFleadmanagement/sidebar.tsx`
    *   **Action:** Add a `Link` under "Masters" for "Error Code Master" to `/masters/error-code-master`.
    *   **File:** `app/masters/error-code-master/page.tsx`
    *   **Action:** Create the page file, importing and rendering the `ErrorCodeMasterComponent`.

**II. New Table: Processed Leads Storage**

1.  **Define `ProcessedLead` Interface and DB Schema (`lib/db.ts`):**
    *   **File:** `lib/db.ts`
    *   **Action:**
        *   Add `ProcessedLead` interface:
            ```typescript
            export interface ProcessedLead {
              id: string; // Primary Key, e.g., `${uploadBatchId}-${originalRowNumber}`
              uploadBatchId: string; // To group leads from the same file
              processedTimestamp: string; // ISO string
              anchorNameSelected: string; // Anchor selected in UI
              programNameSelected: string; // Program selected in UI
              originalRowNumber: number;
              originalData: Record<string, any>; // All columns from uploaded Excel row
              assignedRmAdid: string | null;
              assignmentStatus: string;
              errorCode: string | null;
              errorDescription: string | null;
            }
            ```
        *   Add `processed_leads` table to `SCFLeadManagementDB` class schema definition.
            *   Schema: `processed_leads: 'id, uploadBatchId, processedTimestamp, anchorNameSelected, programNameSelected, assignedRmAdid, assignmentStatus, errorCode'`
        *   Add `processed_leads` to `StoreName` type and `StoreTableMap`.
        *   (No entry needed in `STORE_FIELDS` for `processed_leads` as it's not directly uploaded via the master UI, but populated programmatically).
2.  **Update Dexie Database Version (`lib/db.ts`):**
    *   **File:** `lib/db.ts`
    *   **Action:** Increment the database version number in the `SCFLeadManagementDB` constructor to apply the new `processed_leads` and `error_codes` table schemas. Example: `this.version(currentVersion + 1).stores(...)`.

**III. Enhancements to `NewLeads.tsx` and Supporting Logic**

1.  **Update `UploadResult` Row Interface (`components/SCFleadmanagement/new-leads.tsx`):**
    *   **File:** `components/SCFleadmanagement/new-leads.tsx`
    *   **Action:** Modify the `UploadResult.rows` interface (rename to `UploadResultRow` for clarity within the component):
        ```typescript
        interface UploadResultRow {
          rowNumber: number; // This is the originalExcelRowNumber
          dealerId: string; // Key field from Excel for display
          anchorId: string; // Key field from Excel for display
          rmName: string; // Original RM Name from Excel, if any
          assignedRmAdid?: string; // The finally assigned RM ADID
          status: RowStatus; // UI status: 'success', 'failed'
          error?: string; // This will be the errorDescription for UI
          // Add other relevant original fields if needed for display in the results table
          // Full original data will be stored in the DB but not necessarily all in this UI state
        }
        // UploadResult interface to hold summary and rows for UI display
        interface UploadResult {
          total: number;
          success: number;
          failed: number;
          rows: UploadResultRow[]; // For UI display
        }
        ```
2.  **Implement File Header Validation in `handleUpload` (`components/SCFleadmanagement/new-leads.tsx`):**
    *   **File:** `components/SCFleadmanagement/new-leads.tsx`
    *   **Function:** `handleUpload`
    *   **Action:**
        *   Define `LEAD_TEMPLATE_HEADERS` array constant within the component or import from a shared location (see step III.7).
        *   Before actual processing:
            *   Read headers from `selectedFile`.
            *   Compare with `LEAD_TEMPLATE_HEADERS`. If mismatch:
                *   Set `uploadStatus` to `"failed"`.
                *   Prepare `uploadResult` where all rows are marked as failed with `errorCode: "ERR_HDR_INV"`.
                *   Persist these failed rows to the new `processed_leads` table (see step III.4 for persistence logic).
                *   Return.
            *   If headers match, display a success message in the UI (e.g., "File headers validated. Processing leads...").
3.  **Refactor `handleUpload` for RM Assignment & Persistence (`components/SCFleadmanagement/new-leads.tsx`):**
    *   **File:** `components/SCFleadmanagement/new-leads.tsx`
    *   **Function:** `handleUpload`
    *   **Action:**
        *   Set `uploadStatus("processing")`.
        *   Generate a unique `uploadBatchId` (e.g., using `Date.now().toString()` or a UUID library if available).
        *   Parse `selectedFile` into `jsonData`.
        *   Initialize `uiUploadResult: UploadResult = { total: jsonData.length, success: 0, failed: 0, rows: [] }`.
        *   Create an array `leadsToPersist: ProcessedLead[] = []`.
        *   Fetch `PincodeBranch`, `RMBranch`, and `ErrorCodeMaster` data *once* for lookups. Create Maps for efficient lookup (e.g., `pincodeMap`, `rmBranchMapByBranchCode`, `errorCodesMap`).
        *   Loop through `jsonData` (let `originalRow` be an item and `index` its 0-based index):
            *   `const originalRowNumber = index + 2;` (assuming Excel row 1 is header).
            *   Initialize `processedLeadEntry: Partial<ProcessedLead>` with:
                *   `id: \`${uploadBatchId}-${originalRowNumber}\``
                *   `uploadBatchId: uploadBatchId`
                *   `processedTimestamp: new Date().toISOString()`
                *   `anchorNameSelected: selectedAnchor` (from UI state)
                *   `programNameSelected: selectedProgram` (from UI state)
                *   `originalRowNumber: originalRowNumber`
                *   `originalData: { ...originalRow }`
                *   `assignedRmAdid: null`, `errorCode: null`, `errorDescription: null`
            *   **RM ADID Check (from Excel):**
                *   If `originalRow["RM ADID"]` exists and is not empty:
                    *   `processedLeadEntry.assignedRmAdid = originalRow["RM ADID"];`
                    *   `processedLeadEntry.assignmentStatus = "RM Assigned (Manual)";`
                    *   `processedLeadEntry.errorCode = "INFO_RM_MANUAL";`
                    *   `uiUploadResult.success++;`
                *   **Else (Automatic Assignment):**
                    *   Get `pincode = originalRow["Pincode"]`.
                    *   Lookup in `pincodeMap`. If not found: `errorCode = "ERR_PIN_NF"`.
                    *   Else, get `branchCode`. Lookup in `rmBranchMapByBranchCode`. If not found: `errorCode = "ERR_BR_NMAP"`.
                    *   Else, find RM (first active, then first). If no RM: `errorCode = "ERR_RM_NBR"`.
                    *   If RM found:
                        *   `processedLeadEntry.assignedRmAdid = foundRm.rmId;`
                        *   `processedLeadEntry.assignmentStatus = "RM Assigned (Auto)";`
                        *   `processedLeadEntry.errorCode = "INFO_RM_AUTO";`
                        *   `uiUploadResult.success++;`
                    *   Else (if any auto-assignment step failed and an `errorCode` was set):
                        *   `processedLeadEntry.assignmentStatus = \`Failed: ${errorCodesMap.get(processedLeadEntry.errorCode) || processedLeadEntry.errorCode}\`;`
                        *   `uiUploadResult.failed++;`
            *   `processedLeadEntry.errorDescription = errorCodesMap.get(processedLeadEntry.errorCode || "") || processedLeadEntry.errorCode;`
            *   Add `processedLeadEntry as ProcessedLead` to `leadsToPersist`.
            *   Add a corresponding entry to `uiUploadResult.rows` for UI display (with only necessary fields like `dealerId`, `anchorId` from `originalRow`, `assignedRmAdid`, `status`, `error`).
        *   After loop:
            *   Use `await db.processed_leads.bulkAdd(leadsToPersist);` to save all processed leads.
            *   Set `setUploadResult(uiUploadResult)`.
            *   Update `uploadStatus` and `uploadHistory` as before.
4.  **Update UI Table in `NewLeads.tsx` (`components/SCFleadmanagement/new-leads.tsx`):**
    *   **File:** `components/SCFleadmanagement/new-leads.tsx`
    *   **Action:** Modify the results table:
        *   Headers: `Row`, `Dealer ID` (from original data), `Anchor ID` (from original data), `Assigned RM ADID`, `Status` (Assignment Status), `Error` (Error Description).
        *   Cells: Populate from `uiUploadResult.rows`.
5.  **Implement `handleDownloadResults` for Enriched Response Excel (`components/SCFleadmanagement/new-leads.tsx`):**
    *   **File:** `components/SCFleadmanagement/new-leads.tsx`
    *   **Function:** `handleDownloadResults`
    *   **Action:**
        *   If `!uploadResult` or `leadsToPersist` (from the processing step, might need to store it in state if `handleDownloadResults` is called separately after processing is done, or re-fetch from `processed_leads` table using `uploadBatchId`) is empty, return.
        *   Define `responseExcelHeaders = [...LEAD_TEMPLATE_HEADERS, "Assigned RM ADID", "Assignment Status", "Error Code", "Error Description"]`.
        *   Create `sheetData = [responseExcelHeaders]`.
        *   Iterate over `uploadResult.rows` (or better, the full data stored in `leadsToPersist` if available):
            *   For each `processedLeadItem` (from `leadsToPersist` or reconstructed):
                *   Create `excelRow`.
                *   Populate `excelRow` with values from `processedLeadItem.originalData` according to `LEAD_TEMPLATE_HEADERS`.
                *   Append `processedLeadItem.assignedRmAdid`, `processedLeadItem.assignmentStatus`, `processedLeadItem.errorCode`, `processedLeadItem.errorDescription` to `excelRow`.
                *   Push `excelRow` to `sheetData`.
        *   Generate and download Excel.
6.  **Define `LEAD_TEMPLATE_HEADERS` Constant:**
    *   **File:** `lib/db.ts` (or a new `lib/constants.ts`)
    *   **Action:** Export `LEAD_TEMPLATE_HEADERS` array.
        ```typescript
        export const LEAD_TEMPLATE_HEADERS = [
          "Sr. No.", "Program Type", /* ...all other headers... */, "RM ADID"
        ];
        ```
    *   **File:** `components/SCFleadmanagement/new-leads.tsx`
    *   **Action:** Import `LEAD_TEMPLATE_HEADERS`.
    *   **File:** `lib/db.ts`
    *   **Function:** `MasterService.downloadLeadTemplate`
    *   **Action:** Use the imported `LEAD_TEMPLATE_HEADERS` constant instead of its local definition.

**IV. UI Updates**

1.  **Display File Validation Message (`components/SCFleadmanagement/new-leads.tsx`):**
    *   **File:** `components/SCFleadmanagement/new-leads.tsx`
    *   **Action:** Add a new state, e.g., `fileValidationUIMessage`, and update it after header validation. Display this message below the file input or above the "Upload Results" section. This is distinct from the `uploadResult` alerts which show after full processing.

**V. Configuration or Database Migrations**

1.  **Dexie Database Version Increment (`lib/db.ts`):**
    *   **File:** `lib/db.ts`
    *   **Action:** Ensure the Dexie schema version in `SCFLeadManagementDB` constructor is incremented to reflect the addition of `error_codes` and `processed_leads` tables.
2.  **Pre-populate Error Codes (Optional but Recommended for Testing):**
    *   **File:** `lib/dbUtils.ts` (or a one-time script).
    *   **Action:** Add logic to `initializeDBIfEmpty` to populate the `error_codes` table with initial error codes as outlined in the previous plan, including:
        *   `ERR_HDR_INV`: "Invalid file headers."
        *   `ERR_PIN_NF`: "Pincode not found."
        *   `ERR_BR_NMAP`: "Branch not mapped to RM."
        *   `ERR_RM_NBR`: "No RM for Branch."
        *   `INFO_RM_MANUAL`: "RM assigned from Excel."
        *   `INFO_RM_AUTO`: "RM assigned automatically."
        *   `ERR_ANCHOR_PROG_REQ`: "Anchor and Program must be selected." (Add this new one for UI selection check).
