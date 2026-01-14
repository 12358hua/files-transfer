import { ensureFilesTableExists } from './fileOperations';

// 初始化数据库，确保表存在
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');
    await ensureFilesTableExists();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}