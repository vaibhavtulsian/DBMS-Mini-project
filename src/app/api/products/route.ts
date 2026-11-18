import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Schema for creating product
const productCreateSchema = z.object({
  brand_id: z.number().int().positive(),
  model_name: z.string().min(2),
  release_year: z.number().int().min(2000).max(2030),
  base_description: z.string().optional(),
  spec_text: z.string().optional(),
  display_specs: z.string().optional(),
  camera_specs: z.string().optional(),
  chipset_specs: z.string().optional(),
  battery_specs: z.string().optional(),
  thermal_specs: z.string().optional(),
});

// GET /api/products - Supports filtering by brand, ram, storage, min/max price, availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const ram = searchParams.get('ram');
    const storage = searchParams.get('storage');
    const inStockOnly = searchParams.get('inStock') === 'true';
    const search = searchParams.get('q');

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (brand) {
      conditions.push(`b.brand_name = $${paramIndex++}`);
      params.push(brand);
    }
    if (search) {
      conditions.push(`(p.model_name ILIKE $${paramIndex} OR b.brand_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (ram) {
      conditions.push(`EXISTS (SELECT 1 FROM sku s WHERE s.product_id = p.product_id AND s.ram_gb = $${paramIndex++})`);
      params.push(parseInt(ram, 10));
    }
    if (storage) {
      conditions.push(`EXISTS (SELECT 1 FROM sku s WHERE s.product_id = p.product_id AND s.storage_gb = $${paramIndex++})`);
      params.push(parseInt(storage, 10));
    }
    if (minPrice) {
      conditions.push(`EXISTS (SELECT 1 FROM sku s WHERE s.product_id = p.product_id AND s.wholesale_price >= $${paramIndex++})`);
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push(`EXISTS (SELECT 1 FROM sku s WHERE s.product_id = p.product_id AND s.wholesale_price <= $${paramIndex++})`);
      params.push(parseFloat(maxPrice));
    }
    if (inStockOnly) {
      // Q9 Correlated subquery / EXISTS check
      conditions.push(`EXISTS (
        SELECT 1 FROM sku s
        JOIN inventory inv ON s.sku_id = inv.sku_id
        WHERE s.product_id = p.product_id AND inv.quantity_on_hand > 0
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        p.product_id,
        p.model_name,
        p.release_year,
        p.base_description,
        p.created_at,
        b.brand_id,
        b.brand_name,
        COALESCE(MIN(s.wholesale_price), 0) AS min_price,
        COALESCE(MAX(s.wholesale_price), 0) AS max_price,
        COUNT(DISTINCT s.sku_id) AS sku_count,
        COALESCE(SUM(inv.quantity_on_hand), 0) AS total_inventory,
        COALESCE(AVG(r.rating), 0)::NUMERIC(3, 1) AS avg_rating,
        COUNT(DISTINCT r.review_id) AS review_count
      FROM product p
      JOIN brand b ON p.brand_id = b.brand_id
      LEFT JOIN sku s ON p.product_id = s.product_id AND s.is_active = TRUE
      LEFT JOIN inventory inv ON s.sku_id = inv.sku_id
      LEFT JOIN review r ON p.product_id = r.product_id
      ${whereClause}
      GROUP BY p.product_id, b.brand_id, b.brand_name
      ORDER BY p.product_id DESC;
    `;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, products: res.rows });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/products - Create new product (Distributor only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DISTRIBUTOR') {
      return NextResponse.json({ error: 'Forbidden: Distributor role required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { brand_id, model_name, release_year, base_description, spec_text, display_specs, camera_specs, chipset_specs, battery_specs, thermal_specs } = parsed.data;

    const prodRes = await query(
      `INSERT INTO product (brand_id, model_name, release_year, base_description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [brand_id, model_name, release_year, base_description || null]
    );

    const product = prodRes.rows[0];

    // If specs provided, insert spec sheet
    if (spec_text) {
      await query(
        `INSERT INTO spec_sheet (product_id, spec_text, display_specs, camera_specs, chipset_specs, battery_specs, thermal_specs)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [product.product_id, spec_text, display_specs || null, camera_specs || null, chipset_specs || null, battery_specs || null, thermal_specs || null]
      );
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
