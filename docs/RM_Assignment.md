** RM Assignment Logic Flow**

The system attempts to assign a Relationship Manager (RM) to a new lead based on the data provided in the uploaded Excel file and the newly introduced segment-based rules.

1.  **Initialize Round-Robin Counters:**
    *   At the beginning of an Excel file upload process, a new, in-memory map (`roundRobinCounters`) is created. This map will store the last used index for RM assignment within a specific `branchCode_segment` combination for the current upload batch.

2.  **Fetch Necessary Master Data:**
    *   The system fetches all records from:
        *   `pincode_branch` (for Pincode to Branch mapping)
        *   `rm_branch` (for RM to Branch mapping and RM active status)
        *   `error_codes` (for error descriptions)
        *   `AnchorMaster` (to get the segment of the selected Anchor)
        *   `HierarchyMaster` (to get the segment and other details of RMs)
    *   This data is typically converted into efficient lookup maps (e.g., by Pincode, Branch Code, Anchor Name, RM ADID).

3.  **Determine Anchor Segment:**
    *   For each lead row, the system uses the `selectedAnchor` (chosen in the UI before upload) to find the corresponding entry in the `AnchorMaster` data.
    *   It retrieves the `segment` value (e.g., "SEB", "MIB") for this anchor.
    *   **If the anchor is not found OR its `segment` is empty/invalid:**
        *   Assignment fails for this lead row.
        *   A new error code (e.g., `ERR_ANCHOR_SEG_NF` - Anchor Segment Not Found) is logged.
        *   The process moves to the next lead row.

4.  **Check for Manual RM Assignment (Same as before):**
    *   The system first checks if the "RM ADID" column in the uploaded Excel row for the lead contains a value.
    *   **If an RM ADID is provided:**
        *   This RM ADID is directly assigned to the lead.
        *   `assignmentStatus` becomes "RM Assigned (Manual)".
        *   `errorCode` is `INFO_RM_MANUAL`.
        *   Lead assignment is considered successful for this stage.
    *   **If no RM ADID is provided in the Excel:**
        *   The system proceeds to automatic, segment-based assignment.

5.  **Automatic Segment-Based RM Assignment (Pincode Lookup - Step 1, same as before):**
    *   The system retrieves the "Pincode" from the Excel row.
    *   **If Pincode is missing or empty:**
        *   Assignment fails (`ERR_PIN_NF`).
    *   **If Pincode is present but not found in `pincode_branch` master:**
        *   Assignment fails (`ERR_PIN_NF`).
    *   **If Pincode is found in `pincode_branch` master:**
        *   The system retrieves the associated `branchCode`.

6.  **Automatic Segment-Based RM Assignment (RM Filtering & Assignment - Step 2, MODIFIED LOGIC):**
    *   Using the `branchCode` (from step 5) and the `anchorSegment` (from step 3):
        *   Get all RMs associated with this `branchCode` from the `rm_branch` master data.
        *   Filter this list of RMs to create `eligibleSegmentRMs`. An RM is eligible if:
            1.  They are marked as `active` in the `rm_branch` master data.
            2.  Their `Segment` (from `HierarchyMaster`, looked up using their `rmId`/`EmpADID`) matches the `anchorSegment`.
        *   **If `eligibleSegmentRMs` is empty (no active RMs in that branch belong to the required anchor segment):**
            *   Assignment fails for this lead row.
            *   A new error code (e.g., `ERR_RM_NSEG_ACT` - No Active RM for Segment in Branch) is logged.
        *   **If `eligibleSegmentRMs` contains exactly one RM:**
            *   This single RM is assigned.
            *   `assignmentStatus` becomes "RM Assigned (Auto - Segment)".
            *   `errorCode` is a new info code (e.g., `INFO_RM_SEG_DIRECT`).
        *   **If `eligibleSegmentRMs` contains multiple RMs (Round-Robin Logic):**
            *   Sort the `eligibleSegmentRMs` list consistently (e.g., by RM ADID/`EmpADID`).
            *   Create a unique key for the round-robin counter: `rrKey = branchCode + "_" + anchorSegment`.
            *   Retrieve the `lastAssignedIndex` for this `rrKey` from the `roundRobinCounters` map (initialized to -1 if not found for this batch).
            *   Calculate the `nextIndex = (lastAssignedIndex + 1) % eligibleSegmentRMs.length`.
            *   The RM at `eligibleSegmentRMs[nextIndex]` is assigned.
            *   Update `roundRobinCounters.set(rrKey, nextIndex)` to store the index of the RM just assigned for this `branchCode_segment` combination for the current upload batch.
            *   `assignmentStatus` becomes "RM Assigned (Auto - Segment RR)".
            *   `errorCode` is a new info code (e.g., `INFO_RM_SEG_RR`).

7.  **Post-Assignment Processing (Same as before, with new error codes):**
    *   The `errorDescription` field is populated based on the `errorCode`.
    *   If the assignment was successful, `smartfinUploadStatus` is set to 'pending'.
    *   An `UploadResultRow` is created for UI display.

**Visualization: Revised Flowchart**

```mermaid
graph TD
    AA[Start: New Excel Upload Batch] --> AB[Initialize In-Memory roundRobinCounters Map];
    AB --> A[Start: Process Lead Row from Excel];

    A --> AC{Selected Anchor valid & Segment found in AnchorMaster?};
    AC -- No --> AD[Set error: Anchor Segment Not Found (ERR_ANCHOR_SEG_NF)];
    AD --> Y[Assignment Failed for Row];

    AC -- Yes --> B{RM ADID provided in Excel?};
    B -- Yes --> C[Assign provided RM ADID];
    C --> D[Set status: Manual Assignment (INFO_RM_MANUAL)];
    D --> Z[RM Assignment Successful for Row];

    B -- No --> E{Pincode provided in Excel?};
    E -- No --> F[Set error: Pincode Not Found (ERR_PIN_NF)];
    F --> Y;

    E -- Yes --> G[Lookup Pincode in 'pincode_branch' master];
    G --> H{Pincode found & mapped to Branch?};
    H -- No --> I[Set error: Pincode Not Found (ERR_PIN_NF)];
    I --> Y;

    H -- Yes --> J[Get Branch Code];
    J --> K[Get RMs for Branch Code from 'rm_branch' master];
    K --> KF[Filter RMs: Must be 'active' AND their Segment (from 'hierarchy_master') MUST match Anchor Segment];
    KF --> L{Any Eligible Segment RMs found?};
    L -- No --> M_NEW[Set error: No Active RM for Segment in Branch (ERR_RM_NSEG_ACT)];
    M_NEW --> Y;

    L -- Yes --> N_NEW{Exactly ONE Eligible Segment RM?};
    N_NEW -- Yes --> O_NEW[Assign this Single Eligible Segment RM];
    O_NEW --> P_NEW[Set status: Auto Assignment - Segment (INFO_RM_SEG_DIRECT)];
    P_NEW --> Z;

    N_NEW -- No (Multiple RMs) --> Q_NEW[Apply Round-Robin to Eligible Segment RMs];
    subgraph Round-Robin Logic
        direction LR
        Q_NEW_1[Sort Eligible Segment RMs (by ADID)] --> Q_NEW_2[Create rrKey: branchCode_anchorSegment];
        Q_NEW_2 --> Q_NEW_3[Get lastAssignedIndex for rrKey from roundRobinCounters (default -1)];
        Q_NEW_3 --> Q_NEW_4[nextIndex = (lastAssignedIndex + 1) % count(Eligible RMs)];
        Q_NEW_4 --> Q_NEW_5[Assign RM at nextIndex];
        Q_NEW_5 --> Q_NEW_6[Update roundRobinCounters with nextIndex for rrKey];
    end
    Q_NEW --> R_NEW[Set status: Auto Assignment - Segment RR (INFO_RM_SEG_RR)];
    R_NEW --> Z;

    Z --> SR[Set smartfinUploadStatus: 'pending'];
    SR --> T[End: Row Processed, Continue to next row or finish batch];
    Y --> SY[Log Error Description for Row];
    SY --> T;

```

**Key Changes from Previous Logic:**

*   **Anchor Segment Lookup:** An initial step to determine the target segment based on the UI-selected anchor.
*   **RM Filtering:** RMs are now filtered not just by branch and active status, but critically by their segment matching the anchor's segment.
*   **New Failure Point:** If no active RMs in the correct segment are found for the branch, the assignment fails.
*   **Round-Robin for Multiple Matches:** If multiple eligible RMs are found in the correct segment and branch, a round-robin mechanism (scoped to the current upload batch and specific branch-segment combination) is used.
*   **New Error/Info Codes:** Introduced to reflect the new assignment paths and failure reasons.
*   **Additional Master Data Fetch:** `AnchorMaster` and `HierarchyMaster` are now crucial and fetched upfront.
