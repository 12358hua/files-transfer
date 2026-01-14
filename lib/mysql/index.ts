import { initializeDatabase } from '@/lib/mysql/init';

// 在服务器启动时初始化数据库
export async function initDatabase() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// 导出供应用启动时使用
export default initDatabase;