**II. Planning Phase:**

**A. `MasterService` Enhancements (`lib/db.ts`)**

1.  **Add `getTotalRecords` method to `MasterService`:**
    *   **File:** `lib/db.ts`
    *   **Action:** Define a new static async method `getTotalRecords` within the `MasterService` class.
    *   **Purpose:** This method will retrieve the total count of records for a given master store.
    *   **Details:**
        *   Signature: `static async getTotalRecords<T extends StoreName>(storeName: T): Promise<{ success: boolean, count?: number, error?: string }>`
        *   Implementation: Use `await db[storeName].count()` to get the record count. Wrap it in a try-catch block and return a success/error object similar to other `MasterService` methods.

**B. Individual Master Component Updates**

The following steps will be applied to each of these master components:
*   `components/SCFleadmanagement/masters/anchor-master.tsx`
*   `components/SCFleadmanagement/masters/hierarchy-master.tsx`
*   `components/SCFleadmanagement/masters/holiday-master.tsx`
*   `components/SCFleadmanagement/masters/pincode-branch-master.tsx`
*   `components/SCFleadmanagement/masters/rm-branch-master.tsx`

   For conciseness, the plan below uses `[MasterComponent].tsx` as a placeholder for each specific master component file name and `[dataStateVariable]` (e.g., `anchors`, `hierarchyData`) for the state variable holding the master data.

2.  **State Management in `[MasterComponent].tsx`:**
    *   **Files:**
        *   `components/SCFleadmanagement/masters/anchor-master.tsx`
        *   `components/SCFleadmanagement/masters/hierarchy-master.tsx`
        *   `components/SCFleadmanagement/masters/holiday-master.tsx`
        *   `components/SCFleadmanagement/masters/pincode-branch-master.tsx`
        *   `components/SCFleadmanagement/masters/rm-branch-master.tsx`
    *   **Action:**
        *   Remove any mock data arrays (e.g., `PINCODE_DATA`, `RM_BRANCH_DATA`).
        *   Ensure/Add state for the master data: `const [[dataStateVariable], set[DataStateVariable]] = useState<[MasterType][]>([]);`
        *   Ensure/Add loading state: `const [loading, setLoading] = useState(true);`
        *   Ensure/Add error state: `const [error, setError] = useState<string | null>(null);`
        *   Add pagination states:
            *   `const [currentPage, setCurrentPage] = useState(1);`
            *   `const [itemsPerPage, setItemsPerPage] = useState(10);` (Consider making this a constant for now).
            *   `const [totalRecords, setTotalRecords] = useState(0);`

3.  **Data Fetching in `[MasterComponent].tsx`:**
    *   **Files:** (Same as step 2)
    *   **Action:** Implement or modify the `useEffect` hook for data fetching.
    *   **Details:**
        *   Create an async function `loadData` (e.g., `loadAnchors`, `loadHierarchyData`).
        *   Inside `loadData`:
            1.  Set `setLoading(true)` and `setError(null)`.
            2.  Call `MasterService.getTotalRecords('[storeName]')` (e.g., `'anchor_master'`). Update `totalRecords` state. Handle potential errors by setting `error` state.
            3.  Call `MasterService.getRecords('[storeName]', {}, undefined, itemsPerPage, (currentPage - 1) * itemsPerPage)`. Update `[dataStateVariable]` state. Handle potential errors.
            4.  Set `setLoading(false)`.
        *   Call `loadData` when the component mounts and when `currentPage` or `itemsPerPage` changes.
        *   The `useEffect` dependency array should include `currentPage`, `itemsPerPage`.

4.  **Implement Pagination Logic and UI in `[MasterComponent].tsx`:**
    *   **Files:** (Same as step 2)
    *   **Action:** Add UI elements for pagination and handler functions.
    *   **Details:**
        *   Calculate `totalPages = Math.ceil(totalRecords / itemsPerPage);`.
        *   Implement `handleNextPage` function: `setCurrentPage(prev => Math.min(prev + 1, totalPages));`.
        *   Implement `handlePrevPage` function: `setCurrentPage(prev => Math.max(prev - 1, 1));`.
        *   In the JSX:
            *   Conditionally render a loading indicator (e.g., text or spinner) if `loading` is true.
            *   Conditionally render an error message (e.g., using ShadCN `<Alert>`) if `error` is not null.
            *   If not loading, not error, and `[dataStateVariable].length === 0`, display a message like "No data available. Use the Upload tab to add data." in the table body.
            *   Modify the table rendering to use the paginated `[dataStateVariable]`.
            *   Add "Previous" and "Next" buttons (using ShadCN `<Button>`).
                *   Disable "Previous" if `currentPage === 1`.
                *   Disable "Next" if `currentPage === totalPages` or `totalRecords === 0`.
            *   Display pagination information: e.g., `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalRecords)} of ${totalRecords} records`. This will replace or augment any existing record count display in the component's footer.
            *   The existing client-side search/filter logic will now operate on the data of the current page only.

5.  **Adapt Search/Filter (Client-Side for now) in `[MasterComponent].tsx` (for components that have it, e.g., `pincode-branch-master.tsx`):**
    *   **Files:** `components/SCFleadmanagement/masters/pincode-branch-master.tsx`, `components/SCFleadmanagement/masters/rm-branch-master.tsx`, etc.
    *   **Action:** Ensure the existing `filteredData` logic uses the `[dataStateVariable]` (which now holds the current page's data) as its source.
    *   **Note:** This means search results will be limited to the current page.

6.  **Review `components/SCFleadmanagement/masters/master-layout.tsx`:**
    *   **File:** `components/SCFleadmanagement/masters/master-layout.tsx`
    *   **Action:** The `recordsCount` state and its display ("Total records: X") in this layout can remain as a general indicator of the total data in the store. The more specific pagination info ("Showing Y-Z of X records") will be handled within each child master component. No major changes are needed here, but be mindful of potential visual redundancy if not styled clearly. The data refresh logic after upload (switching to "view" tab) should naturally trigger the child component's `useEffect` to fetch fresh paginated data.

**C. Database Migrations or Configuration**

*   No database schema migrations are required as `Dexie` and `MasterService` are already set up to handle the data. The primary change is in how data is fetched and displayed.
*   No new configuration files are needed.

This plan ensures that each master data view will fetch and display real data from IndexedDB, present it in a paginated format, and provide appropriate loading and error states.