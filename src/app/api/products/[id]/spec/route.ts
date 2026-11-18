import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { chunkSpecText, generateEmbedding, formatVector } from '@/lib/embeddings';

const specUpdateSchema = z.object({
  spec_text: z.string().min(10),
  display_specs: z.string().optional().nullable(),
  camera_specs: z.string().optional().nullable(),
  chipset_specs: z.string().optional().nullable(),
  battery_specs: z.string().optional().nullable(),
  thermal_specs: z.string().optional().nullable(),
});

// GET /api/products/[id]/spec
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10);
    const res = await query('SELECT * FROM spec_sheet WHERE product_id = $1', [productId]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Spec sheet not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, spec: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/products/[id]/spec - Edit spec sheet and trigger chunk re-embedding
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
    const parsed = specUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { spec_text, display_specs, camera_specs, chipset_specs, battery_specs, thermal_specs } = parsed.data;

    // 1. Fetch Product metadata for embedding metadata
    const prodRes = await query(
      `SELECT p.product_id, p.model_name, b.brand_name
       FROM product p
       JOIN brand b ON p.brand_id = b.brand_id
       WHERE p.product_id = $1`,
      [productId]
    );

    if (prodRes.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const productInfo = prodRes.rows[0];

    // 2. Upsert Spec Sheet
    const specUpsertRes = await query(
      `INSERT INTO spec_sheet (product_id, spec_text, display_specs, camera_specs, chipset_specs, battery_specs, thermal_specs, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (product_id) DO UPDATE SET
          spec_text = EXCLUDED.spec_text,
          display_specs = EXCLUDED.display_specs,
          camera_specs = EXCLUDED.camera_specs,
          chipset_specs = EXCLUDED.chipset_specs,
          battery_specs = EXCLUDED.battery_specs,
          thermal_specs = EXCLUDED.thermal_specs,
          updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [productId, spec_text, display_specs || null, camera_specs || null, chipset_specs || null, battery_specs || null, thermal_specs || null]
    );

    const savedSpec = specUpsertRes.rows[0];

    // 3. FR-C3: Trigger re-embedding of that product's spec chunks
    // Q3 DELETE: replace old embedding rows when a spec is re-saved
    await query('DELETE FROM spec_embedding WHERE spec_id = $1', [savedSpec.spec_id]);

    const chunks = chunkSpecText({
      spec_text,
      display_specs,
      camera_specs,
      chipset_specs,
      battery_specs,
      thermal_specs,
      model_name: productInfo.model_name,
    });

    let embeddedCount = 0;
    for (const chunk of chunks) {
      const vec = await generateEmbedding(chunk.text);
      const metadata = {
        product_id: productId,
        model_name: productInfo.model_name,
        brand_name: productInfo.brand_name,
        category: chunk.category,
      };

      await query(
        `INSERT INTO spec_embedding (spec_id, chunk_category, chunk_text, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5)`,
        [savedSpec.spec_id, chunk.category, chunk.text, formatVector(vec), JSON.stringify(metadata)]
      );
      embeddedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Spec sheet saved and ${embeddedCount} chunks re-embedded successfully`,
      spec: savedSpec,
      chunksEmbedded: embeddedCount,
    });
  } catch (err: any) {
    console.error('Error saving spec sheet:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
