import { notFound } from "next/navigation"
import { getFileByShareId, deleteFileByShareId } from "@/lib/mysql/fileOperations"
import { FileInfo } from "@/components/file-info"
import fileStorage from "@/lib/utils/fileStorage"

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params

  const fileRecord = await getFileByShareId(shareId)

  if (!fileRecord) {
    notFound()
  }
  
  // 检查文件是否已过期
  const now = new Date();
  const expiresAt = new Date(fileRecord.expires_at);
  
  // 检查文件是否已删除或已过期
  if (fileRecord.is_deleted || now > expiresAt) {
    // 文件已删除或已过期，删除本地文件
    try {
      await fileStorage.deleteFile(fileRecord.blob_url);
    } catch (error) {
      console.error('删除本地文件时出错:', error);
    }
    
    // 如果文件已过期但未被逻辑删除，则将其标记为已删除
    if (!fileRecord.is_deleted && now > expiresAt) {
      try {
        await deleteFileByShareId(shareId);
      } catch (error) {
        console.error('更新数据库记录时出错:', error);
      }
    }
    
    notFound();
  }

  const fileData = {
    id: fileRecord.id,
    shareId: fileRecord.share_id,
    filename: fileRecord.filename,
    fileSize: fileRecord.file_size,
    contentType: fileRecord.content_type || '',
    blobUrl: fileRecord.blob_url,
    createdAt: fileRecord.created_at,
    expiresAt: fileRecord.expires_at,
    downloadCount: fileRecord.download_count,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">文件分享</h1>
            <p className="text-muted-foreground text-lg">查看并下载分享的文件</p>
          </div>

          <FileInfo fileData={fileData} showDelete={false} />
        </div>
      </div>
    </div>
  )
}
