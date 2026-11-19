import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery, mysqlExecute } from '@/lib/mysql';

/**
 * Endpoint demonstrating MySQL 8.0 Master Catalog & Audit Log Operations
 * GET /api/mysql
 */
export async function GET() {
  try {
    // 1. Query table counts from MySQL
    const [brandCount]: any = await mysqlQuery('SELECT COUNT(*) AS total FROM brand');
    const [productCount]: any = await mysqlQuery('SELECT COUNT(*) AS total FROM product');
    const [skuCount]: any = await mysqlQuery('SELECT COUNT(*) AS total FROM sku');
    const [auditCount]: any = await mysqlQuery('SELECT COUNT(*) AS total FROM audit_log');

    // 2. Query recent audit logs
    const auditLogs = await mysqlQuery(`
      SELECT log_id, table_name, action_type, record_id, action_by, details, timestamp
      FROM audit_log
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    // 3. Query sample products with full-text capability
    const sampleProducts = await mysqlQuery(`
      SELECT p.product_id, p.name, p.category, p.base_mrp, b.name AS brand_name
      FROM product p
      JOIN brand b ON p.brand_id = b.brand_id
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      database: 'MySQL 8.0 (wholesale_catalog)',
      status: 'Connected',
      statistics: {
        totalBrands: brandCount?.total || 0,
        totalProducts: productCount?.total || 0,
        totalSkus: skuCount?.total || 0,
        totalAuditLogs: auditCount?.total || 0,
      },
      recentAuditLogs: auditLogs,
      sampleMasterCatalog: sampleProducts,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      database: 'MySQL 8.0',
      status: 'Error or Disconnected',
      error: err.message,
    }, { status: 500 });
  }
}

/**
 * POST /api/mysql/audit
 * Inserts an audit event into MySQL audit_log table
 */
export async function POST(request: NextRequest) {
  try {
    const { tableName, actionType, recordId, actionBy, details } = await request.json();
    
    await mysqlExecute(
      `INSERT INTO audit_log (table_name, action_type, record_id, action_by, details)
       VALUES (?, ?, ?, ?, ?)`,
      [tableName, actionType, recordId, actionBy || 'ADMIN', JSON.stringify(details || {})]
    );

    return NextResponse.json({ success: true, message: 'Audit log entry recorded in MySQL 8.0' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
