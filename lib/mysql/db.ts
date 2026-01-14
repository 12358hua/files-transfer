import mysql from 'mysql2/promise';

// 从环境变量创建数据库连接
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'file_transfer_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
};

let pool: mysql.Pool | null = null;

// 创建连接池
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// 获取单个连接（用于事务）
export async function getConnection(): Promise<mysql.PoolConnection> {
  const pool = getPool();
  return await pool.getConnection();
}

// 执行查询的通用函数
export async function executeQuery<T>(query: string, params?: any[]): Promise<T> {
  const pool = getPool();
  const [results] = await pool.execute(query, params || []);
  return results as T;
}

// 释放连接
export async function releaseConnection(connection: mysql.PoolConnection): Promise<void> {
  connection.release();
}