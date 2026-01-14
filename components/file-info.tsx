"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Trash2, Copy, Check, FileIcon, Upload } from "lucide-react"
import { formatBytes } from "@/lib/utils"

interface FileInfoProps {
  fileData: {
    id: string
    shareId: string
    filename: string
    fileSize: number
    contentType: string
    blobUrl: string
    createdAt: string
    expiresAt?: string
    downloadCount?: number
  }
  showDelete?: boolean
  onDelete?: () => void
}

export function FileInfo({ fileData, showDelete = true, onDelete }: FileInfoProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${fileData.shareId}`

  const handleCopyLink = async () => {
    try {
      // 检查是否支持 clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // 备用方案：使用 execCommand 方法
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
      // 如果复制失败，提示用户手动复制
      alert('复制失败，请手动复制链接: ' + shareUrl);
    }
  }

  const handleDownload = () => {
    // 创建一个隐藏的链接元素来触发下载，并使用原始文件名
    const link = document.createElement('a');
    link.href = fileData.blobUrl;
    link.download = fileData.filename; // 使用数据库中存储的原始文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleDelete = async () => {
    if (!confirm("确定要删除这个文件吗？")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/files/${fileData.shareId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("删除失败")
      }

      onDelete?.()
    } catch (error) {
      console.error("Delete error:", error)
      alert("删除失败，请重试")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          文件详情
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">文件名</p>
              <p className="text-base font-semibold break-all">{fileData.filename}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">文件大小</p>
            <p className="text-base font-semibold">{formatBytes(fileData.fileSize)}</p>
          </div>

          {fileData.contentType && (
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-muted-foreground">文件类型</p>
              <p className="text-base font-semibold">{fileData.contentType}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">上传时间</p>
            <p className="text-base font-semibold">{new Date(fileData.createdAt).toLocaleString("zh-CN")}</p>
          </div>

          {fileData.expiresAt && (
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-muted-foreground">到期时间</p>
              <p className="text-base font-semibold text-red-500">{new Date(fileData.expiresAt).toLocaleString("zh-CN")}</p>
            </div>
          )}

          {fileData.downloadCount !== undefined && (
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-muted-foreground">下载次数</p>
              <p className="text-base font-semibold">{fileData.downloadCount}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium text-muted-foreground">分享链接</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border border-input"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0 bg-transparent">
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            下载文件
          </Button>
          <Button onClick={() => window.location.href = '/'} className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            再次上传
          </Button>
          {showDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "删除中..." : "删除文件"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
