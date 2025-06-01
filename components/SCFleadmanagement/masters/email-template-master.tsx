"use client"

import { useState, useEffect } from "react"
import { MasterService } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import MasterLayout from "@/components/SCFleadmanagement/masters/master-layout"
import type { EmailTemplateMaster } from "@/lib/db"
import { Loader2, ChevronLeft, ChevronRight, Search, Eye, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { safeDbOperation } from "@/lib/db-init"
import { resetDatabase } from "@/lib/db-init"
import dbUtils from "@/lib/dbUtils"

export default function EmailTemplateMasterComponent() {
  const [templates, setTemplates] = useState<EmailTemplateMaster[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateMaster | null>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [resetting, setResetting] = useState<boolean>(false)
  const [initializing, setInitializing] = useState<boolean>(false)

  // Load templates when component mounts or page changes
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log("Fetching email templates...");
        const offset = (currentPage - 1) * itemsPerPage
        
        // Use safeDbOperation to handle potential database errors
        const result = await safeDbOperation(
          async () => {
            console.log("Calling MasterService.getRecords for email_template_master");
            const templates = await MasterService.getRecords(
              'email_template_master',
              {}, // No filters initially
              undefined, // No specific sort field
              itemsPerPage,
              offset
            );
            console.log("Templates result:", templates);
            return templates;
          },
          { success: false, data: [] }
        )

        if (result.success && result.data) {
          console.log(`Found ${result.data.length} templates:`, result.data);
          setTemplates(result.data as EmailTemplateMaster[])
          
          // Get total count
          const countResult = await safeDbOperation(
            async () => {
              console.log("Getting total count of email templates");
              const count = await MasterService.getTotalRecords('email_template_master');
              console.log("Total count result:", count);
              return count;
            },
            { success: false }
          )
          
          if (countResult.success && countResult.count !== undefined) {
            setTotalRecords(countResult.count)
          } else {
            console.error("Failed to get count:", countResult);
          }
        } else {
          console.error("Failed to fetch templates:", result);
          setError("Failed to fetch templates: " + (result.error || "Unknown error"))
        }
      } catch (err) {
        console.error("Error fetching templates:", err)
        setError("An error occurred while fetching templates: " + (err instanceof Error ? err.message : String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [currentPage, itemsPerPage])

  // Handle search
  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setCurrentPage(1) // Reset to first page when searching
    
    try {
      let result;
      
      if (searchTerm.trim() === "") {
        // If search is cleared, get all templates
        result = await safeDbOperation(
          async () => MasterService.getRecords(
            'email_template_master',
            {},
            undefined,
            itemsPerPage,
            0
          ),
          { success: false, data: [] }
        )
      } else {
        // Search in templateName or category fields
        result = await safeDbOperation(
          async () => MasterService.getRecords(
            'email_template_master',
            { templateName: searchTerm },
            undefined,
            itemsPerPage,
            0
          ),
          { success: false, data: [] }
        )
      }

      if (result.success && result.data) {
        setTemplates(result.data as EmailTemplateMaster[])
      } else {
        setError("Search failed")
      }
    } catch (err) {
      console.error("Error searching templates:", err)
      setError("An error occurred during search")
    } finally {
      setLoading(false)
    }
  }

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < Math.ceil(totalRecords / itemsPerPage)) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Format recipient arrays for display
  const formatRecipients = (recipients: string[] | undefined) => {
    if (!recipients || recipients.length === 0) return "-";
    return recipients.join(", ");
  }

  // Handle view template details
  const handleViewTemplate = (template: EmailTemplateMaster) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  }

  // Add a handler to reset the database
  const handleResetDatabase = async () => {
    if (confirm("This will reset the database and reload the page. Are you sure?")) {
      setResetting(true)
      try {
        await resetDatabase()
        // Reload the page after reset
        window.location.reload()
      } catch (err) {
        console.error("Error resetting database:", err)
        setError("Failed to reset database")
        setResetting(false)
      }
    }
  }

  // Add a handler to manually initialize the email templates
  const handleInitializeTemplates = async () => {
    if (confirm("This will manually initialize the email templates. Continue?")) {
      setInitializing(true)
      try {
        console.log("Manually initializing email templates...");
        await dbUtils.initializeDBIfEmpty();
        console.log("Database initialization completed");
        
        // Reload the templates
        const result = await MasterService.getRecords(
          'email_template_master',
          {},
          undefined,
          itemsPerPage,
          0
        );
        
        console.log("Templates after initialization:", result);
        
        if (result.success && result.data) {
          setTemplates(result.data as EmailTemplateMaster[]);
          
          const countResult = await MasterService.getTotalRecords('email_template_master');
          if (countResult.success && countResult.count !== undefined) {
            setTotalRecords(countResult.count);
          }
          
          setError(null);
        }
      } catch (err) {
        console.error("Error initializing templates:", err);
        setError("Failed to initialize templates: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setInitializing(false);
      }
    }
  }

  return (
    <MasterLayout
      title="Email Template Master"
      description="View and manage email templates used throughout the system"
      storeName="email_template_master"
      hideUploadTab={true}
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex w-full sm:w-auto space-x-2">
            <div className="flex-1 sm:w-64">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search by template name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                />
              </div>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
          
          {/* Add initialize templates button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleInitializeTemplates}
            disabled={initializing}
            className="ml-auto"
          >
            {initializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Initialize Templates
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p>{error}</p>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleResetDatabase} 
                className="mt-2 sm:mt-0"
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Database
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs mt-2">
              If you're seeing a schema error, you might need to reset the database
            </p>
          </div>
        )}

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>To</TableHead>
                <TableHead>CC</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
                      <span className="ml-2">Loading templates...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.templateName}</TableCell>
                    <TableCell>{template.category || "-"}</TableCell>
                    <TableCell>{formatRecipients(template.toRecipients)}</TableCell>
                    <TableCell>{formatRecipients(template.ccRecipients)}</TableCell>
                    <TableCell>{template.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewTemplate(template)}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Body
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {templates.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} templates
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= Math.ceil(totalRecords / itemsPerPage) || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Template Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.templateName || "Email Template"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description || "Email template details"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Subject</h4>
                <div className="p-2 border rounded bg-gray-50 dark:bg-gray-900">
                  {selectedTemplate?.subject || "No subject"}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">To Recipients</h4>
                  <div className="p-2 border rounded bg-gray-50 dark:bg-gray-900">
                    {formatRecipients(selectedTemplate?.toRecipients)}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">CC Recipients</h4>
                  <div className="p-2 border rounded bg-gray-50 dark:bg-gray-900">
                    {formatRecipients(selectedTemplate?.ccRecipients)}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Email Body</h4>
                <div 
                  className="p-3 border rounded bg-white dark:bg-gray-900 max-h-80 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate?.body || "No content" }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  )
} 