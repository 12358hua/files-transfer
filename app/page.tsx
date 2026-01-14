"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { FileInfo } from "@/components/file-info"

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<{
    id: string
    shareId: string
    filename: string
    fileSize: number
    contentType: string
    blobUrl: string
    createdAt: string
    expiresAt?: string
    downloadCount?: number
  } | null>(null)

  const handleUploadSuccess = (fileData: {
    id: string
    shareId: string
    filename: string
    fileSize: number
    contentType: string
    blobUrl: string
    createdAt: string
    expiresAt?: string
    downloadCount?: number
  }) => {
    setUploadedFile(fileData)
  }

  const handleDelete = () => {
    setUploadedFile(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">文件传输工具</h1>
            <p className="text-muted-foreground text-lg">快速上传、分享和下载文件</p>
          </div>

          {!uploadedFile ? (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          ) : (
            <FileInfo fileData={uploadedFile} showDelete={true} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  )
}
