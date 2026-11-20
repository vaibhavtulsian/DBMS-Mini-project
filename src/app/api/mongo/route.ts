import { NextRequest, NextResponse } from 'next/server';
import { mongoQuery, mongoInsertOne, getMongoDb } from '@/lib/mongo';

/**
 * Endpoint demonstrating MongoDB Master Catalog & Audit Log Operations
 * GET /api/mongo
 */
export async function GET() {
  try {
    const db = await getMongoDb();

    // 1. Query collection counts from MongoDB
    const brandCount = await db.collection('brands').countDocuments();
    const productCount = await db.collection('products').countDocuments();
    const skuCount = await db.collection('skus').countDocuments();
    const auditCount = await db.collection('audit_logs').countDocuments();

    // 2. Query recent audit logs
    const auditLogs = await mongoQuery('audit_logs', {}, {
      sort: { timestamp: -1 },
      limit: 10,
    });

    // 3. Query sample products with brand lookup (aggregation pipeline)
    const sampleProducts = await db.collection('products').aggregate([
      { $lookup: { from: 'brands', localField: 'brand_id', foreignField: 'brand_id', as: 'brand' } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      { $project: { product_id: 1, name: 1, category: 1, base_mrp: 1, brand_name: '$brand.name' } },
      { $limit: 5 },
    ]).toArray();

    return NextResponse.json({
      success: true,
      database: 'MongoDB 7 (wholesale_catalog)',
      status: 'Connected',
      statistics: {
        totalBrands: brandCount,
        totalProducts: productCount,
        totalSkus: skuCount,
        totalAuditLogs: auditCount,
      },
      recentAuditLogs: auditLogs,
      sampleMasterCatalog: sampleProducts,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      database: 'MongoDB 7',
      status: 'Error or Disconnected',
      error: err.message,
    }, { status: 500 });
  }
}

/**
 * POST /api/mongo
 * Inserts an audit event into MongoDB audit_logs collection
 */
export async function POST(request: NextRequest) {
  try {
    const { tableName, actionType, recordId, actionBy, details } = await request.json();

    await mongoInsertOne('audit_logs', {
      table_name: tableName,
      action_type: actionType,
      record_id: recordId,
      action_by: actionBy || 'ADMIN',
      details: details || {},
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Audit log entry recorded in MongoDB' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
