import { type NextRequest, NextResponse } from "next/server"
import { getFileByShareId, deleteFileByShareId } from "@/lib/mysql/fileOperations"
import fileStorage from "@/lib/utils/fileStorage"

export async function GET(request: NextRequest, { params }: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId } = await params

    const fileRecord = await getFileByShareId(shareId)

    if (!fileRecord) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 })
    }

    return NextResponse.json({
      id: fileRecord.id,
      shareId: fileRecord.share_id,
      filename: fileRecord.filename,
      fileSize: fileRecord.file_size,
      contentType: fileRecord.content_type,
      blobUrl: fileRecord.blob_url,
      createdAt: fileRecord.created_at,
      expiresAt: fileRecord.expires_at,
      downloadCount: fileRecord.download_count,
    })
  } catch (error) {
    console.error("Get file error:", error)
    return NextResponse.json({ error: "获取文件失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId } = await params

    // Get file info first
    const fileRecord = await getFileByShareId(shareId)

    if (!fileRecord) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 })
    }

    // 删除本地文件
    const fileDeleted = await fileStorage.deleteFile(fileRecord.blob_url);
    if (!fileDeleted) {
      console.error('Failed to delete local file:', fileRecord.blob_url);
      // 即使文件删除失败，也要继续删除数据库记录
    }
    
    // 从数据库逻辑删除
    const success = await deleteFileByShareId(shareId)

    if (!success) {
      return NextResponse.json({ error: "删除文件失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
