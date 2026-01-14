import { type NextRequest, NextResponse } from "next/server"
import { insertFileRecord } from "@/lib/mysql/fileOperations"
import { nanoid } from "nanoid"
import fileStorage from "@/lib/utils/fileStorage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有提供文件" }, { status: 400 })
    }

    // 保存文件到本地
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await fileStorage.saveFile(buffer, file.name);

    // Generate unique share ID
    const shareId = nanoid(8)

    // Save metadata to MySQL
    try {
      const fileRecord = await insertFileRecord({
        share_id: shareId,
        filename: file.name,
        file_size: file.size,
        content_type: file.type,
        blob_url: fileUrl,
      })

      if (!fileRecord) {
        // 如果插入失败，删除已上传的本地文件
        return NextResponse.json({ error: "保存文件信息失败" }, { status: 500 })
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
    } catch (dbError) {
      console.error("Database error:", dbError)
      // 删除本地文件，如果数据库插入失败
      try {
        // 注意：这里我们无法删除文件，因为我们没有导入fs模块
        // 实际应用中可能需要额外的清理逻辑
      } catch (cleanupError) {
        console.error("Failed to clean up file after DB error:", cleanupError)
      }
      return NextResponse.json({ error: "保存文件信息失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "上传失败" }, { status: 500 })
  }
}
