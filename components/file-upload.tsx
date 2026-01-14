"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface FileUploadProps {
  onUploadSuccess: (fileData: {
    id: string
    shareId: string
    filename: string
    fileSize: number
    contentType: string
    blobUrl: string
    createdAt: string
  }) => void
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await uploadFile(files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await uploadFile(files[0])
    }
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // 模拟上传进度
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      // 完成进度
      clearInterval(interval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("上传失败")
      }

      const data = await response.json()
      onUploadSuccess(data)
    } catch (error) {
      console.error("Upload error:", error)
      alert("上传失败，请重试")
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 500); // 重置进度条
    }
  }

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center p-12">
        {isUploading ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="w-full">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">上传进度</span>
                <span className="text-sm font-medium text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">上传中...</p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">上传文件</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">拖拽文件到此处或点击选择文件</p>
            <Button asChild>
              <label className="cursor-pointer">
                选择文件
                <input type="file" className="hidden" onChange={handleFileSelect} />
              </label>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
