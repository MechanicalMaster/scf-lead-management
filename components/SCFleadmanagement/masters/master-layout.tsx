"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MasterLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  lastUpdated?: {
    date: string
    user: string
  }
}

export default function MasterLayout({ title, description, children, lastUpdated }: MasterLayoutProps) {
  const [activeTab, setActiveTab] = useState("view")
  const [file, setFile] = useState<File | null>(null)
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "success" | "error">("idle")
  const [validationMessage, setValidationMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValidationStatus("idle")
      setValidationMessage("")
    }
  }

  const handleValidate = () => {
    if (!file) return

    setValidationStatus("validating")

    // Simulate validation process
    setTimeout(() => {
      // For demo purposes, we'll randomly succeed or fail
      const isValid = Math.random() > 0.3

      if (isValid) {
        setValidationStatus("success")
        setValidationMessage("File validation successful. Ready to upload.")
      } else {
        setValidationStatus("error")
        setValidationMessage("Validation failed. Please check the file format and data.")
      }
    }, 1500)
  }

  const handleUpload = () => {
    if (!file || validationStatus !== "success") return

    // Here you would handle the actual upload
    alert(`Uploading file: ${file.name}`)

    // Reset state after upload
    setFile(null)
    setValidationStatus("idle")
    setValidationMessage("")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        {lastUpdated && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated on <span className="font-medium">{lastUpdated.date}</span> by{" "}
            <span className="font-medium">{lastUpdated.user}</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            View Master Data
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          {children}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Upload an Excel file to update the master data. The file will be validated before updating.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                {!file ? (
                  <>
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Drag and drop your Excel file here
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">or click to browse files</p>
                    </div>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-10 w-10 text-green-500" />
                      <div className="ml-4 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null)
                        setValidationStatus("idle")
                        setValidationMessage("")
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {file && validationStatus !== "idle" && (
                <Alert variant={validationStatus === "error" ? "destructive" : "default"}>
                  {validationStatus === "validating" && (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Validating</AlertTitle>
                      <AlertDescription>Please wait while we validate your file...</AlertDescription>
                    </>
                  )}

                  {validationStatus === "success" && (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Validation Successful</AlertTitle>
                      <AlertDescription>{validationMessage}</AlertDescription>
                    </>
                  )}

                  {validationStatus === "error" && (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Validation Failed</AlertTitle>
                      <AlertDescription>{validationMessage}</AlertDescription>
                    </>
                  )}
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("view")}>
                Cancel
              </Button>
              <div className="space-x-2">
                {file && validationStatus === "idle" && <Button onClick={handleValidate}>Validate File</Button>}

                {file && validationStatus === "success" && <Button onClick={handleUpload}>Upload File</Button>}

                {file && validationStatus === "error" && (
                  <Button onClick={() => setFile(null)}>Select Another File</Button>
                )}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
              <CardDescription>Please follow these guidelines to ensure successful data upload</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Use the provided Excel template for uploading data</li>
                <li>Ensure all required fields are filled</li>
                <li>Data will be validated against existing records</li>
                <li>Maximum file size: 5MB</li>
                <li>Supported formats: .xlsx, .xls</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

