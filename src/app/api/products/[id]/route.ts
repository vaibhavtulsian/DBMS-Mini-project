import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // 1. Fetch Product & Brand
    const productRes = await query(
      `SELECT p.*, b.brand_name, b.country_of_origin
       FROM product p
       JOIN brand b ON p.brand_id = b.brand_id
       WHERE p.product_id = $1`,
      [productId]
    );

    if (productRes.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productRes.rows[0];

    // 2. Fetch Spec Sheet
    const specRes = await query(
      `SELECT * FROM spec_sheet WHERE product_id = $1`,
      [productId]
    );
    const specSheet = specRes.rows[0] || null;

    // 3. Fetch SKUs with inventory per warehouse
    const skuRes = await query(
      `SELECT s.*,
              COALESCE(SUM(inv.quantity_on_hand), 0)::INT AS total_stock
       FROM sku s
       LEFT JOIN inventory inv ON s.sku_id = inv.sku_id
       WHERE s.product_id = $1 AND s.is_active = TRUE
       GROUP BY s.sku_id
       ORDER BY s.wholesale_price ASC`,
      [productId]
    );

    // 4. Fetch warehouse-level stock for each SKU
    const inventoryRes = await query(
      `SELECT inv.sku_id, inv.warehouse_id, inv.quantity_on_hand, inv.reorder_threshold,
              w.warehouse_name, w.city, w.region
       FROM inventory inv
       JOIN warehouse w ON inv.warehouse_id = w.warehouse_id
       JOIN sku s ON inv.sku_id = s.sku_id
       WHERE s.product_id = $1
       ORDER BY w.region, w.warehouse_name`,
      [productId]
    );

    // 5. Fetch Reviews & Rating summary
    const reviewsRes = await query(
      `SELECT r.*, ret.business_name, ret.city, ret.region
       FROM review r
       JOIN retailer ret ON r.retailer_id = ret.retailer_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    return NextResponse.json({
      success: true,
      product,
      specSheet,
      skus: skuRes.rows,
      inventory: inventoryRes.rows,
      reviews: reviewsRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching product details:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update product metadata (Distributor only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const productId = parseInt(params.id, 10);
    const body = await request.json();

    const { model_name, release_year, base_description, brand_id } = body;

    const res = await query(
      `UPDATE product
       SET model_name = COALESCE($1, model_name),
           release_year = COALESCE($2, release_year),
           base_description = COALESCE($3, base_description),
           brand_id = COALESCE($4, brand_id)
       WHERE product_id = $5 RETURNING *`,
      [model_name, release_year, base_description, brand_id, productId]
    );

    return NextResponse.json({ success: true, product: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
