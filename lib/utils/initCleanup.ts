// 初始化自动清理任务（现在是空实现，因为已移除定时器）
export function initCleanup(): void {
  console.log('自动清理定时器功能已移除，使用手动清理或外部调度');
}

// 停止清理功能（空实现）
export function stopCleanup(): void {
  console.log('停止清理功能（定时器已移除）');
}

// 移除定时器ID导出
export const cleanupIntervalId = null;