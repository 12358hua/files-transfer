import { NextRequest, NextResponse } from 'next/server';
import { autoCleanupExpiredFiles } from '@/lib/utils/autoCleanup';

export async function GET(request: NextRequest) {
  try {
    // 验证请求来源（可选的安全措施）
    // 在实际应用中，您可能需要添加身份验证
    await autoCleanupExpiredFiles();
    return NextResponse.json({ 
      success: true, 
      message: '过期文件清理完成' 
    });
  } catch (error) {
    console.error('清理过期文件时出错:', error);
    return NextResponse.json({ 
      success: false, 
      error: '清理失败' 
    }, { status: 500 });
  }
}