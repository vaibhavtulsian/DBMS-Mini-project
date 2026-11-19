import mysql from 'mysql2/promise';

// MySQL Connection Pool Configuration for Master Catalog & User Auth
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'wholesale_user',
  password: process.env.MYSQL_PASSWORD || 'wholesale_pass',
  database: process.env.MYSQL_DATABASE || 'wholesale_catalog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Executes a parameterized MySQL query and returns rows
 */
export async function mysqlQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params || []);
  return rows as T[];
}

/**
 * Executes a single statement (insert, update, delete) and returns the result header
 */
export async function mysqlExecute(sql: string, params?: any[]): Promise<any> {
  const [result] = await pool.execute(sql, params || []);
  return result;
}

/**
 * Returns raw pool for transaction support
 */
export function getMysqlPool() {
  return pool;
}

export default pool;
