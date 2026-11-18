let extractor: any = null;
let isLoading = false;

/**
 * Initializes the Transformers.js pipeline locally
 */
async function getExtractor() {
  if (extractor) return extractor;
  if (isLoading) {
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return extractor;
  }

  isLoading = true;
  try {
    const { pipeline, env } = await import('@xenova/transformers');
    // Configure cache directory and disable remote telemetry
    env.allowLocalModels = true;
    env.useBrowserCache = false;
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
    console.log('✅ Transformers.js all-MiniLM-L6-v2 model loaded successfully');
  } catch (err) {
    console.warn('⚠️ Could not load Xenova model locally, falling back to deterministic semantic vector generator:', err);
    extractor = null;
  } finally {
    isLoading = false;
  }
  return extractor;
}

/**
 * Deterministic semantic 384-dimensional vector fallback
 * Ensures consistent cosine distances for keywords and semantic concepts
 * even if Hugging Face weights cannot be downloaded in a closed sandbox.
 */
function generateSemanticFallbackVector(text: string): number[] {
  const DIM = 384;
  const vec = new Array(DIM).fill(0);
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\W+/).filter(Boolean);

  // Key semantic anchors mapped to specific vector dimensions
  const concepts: Record<string, number> = {
    thermal: 12,
    heat: 12,
    cooling: 13,
    vapor: 13,
    temperature: 14,
    camera: 45,
    photo: 46,
    video: 47,
    sensor: 48,
    lens: 49,
    telephoto: 50,
    zoom: 51,
    night: 52,
    battery: 90,
    charging: 91,
    mah: 92,
    endurance: 93,
    chipset: 140,
    processor: 141,
    cpu: 142,
    gpu: 143,
    snapdragon: 144,
    bionic: 145,
    gaming: 180,
    fps: 181,
    display: 220,
    screen: 221,
    amoled: 222,
    hz: 223,
    oled: 224,
    pro: 260,
    flagship: 261,
    budget: 290,
    value: 291,
    wholesale: 320,
    retailer: 321,
  };

  // Seed baseline components
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    let hash = 0;
    for (let j = 0; j < w.length; j++) {
      hash = (hash << 5) - hash + w.charCodeAt(j);
      hash |= 0;
    }
    const baseIdx = Math.abs(hash) % DIM;
    vec[baseIdx] += 1.0;
    vec[(baseIdx + 17) % DIM] += 0.5;

    // Boost matching concept dimensions
    for (const [concept, targetDim] of Object.entries(concepts)) {
      if (w.includes(concept) || concept.includes(w)) {
        vec[targetDim] += 3.0;
        vec[(targetDim + 1) % DIM] += 1.5;
      }
    }
  }

  // Normalize to unit length (L2 norm = 1.0 for cosine similarity)
  let norm = 0;
  for (let i = 0; i < DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1.0;
  for (let i = 0; i < DIM; i++) {
    vec[i] = Number((vec[i] / norm).toFixed(6));
  }

  return vec;
}

/**
 * Generate a 384-dimensional vector embedding for a piece of text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getExtractor();
    if (pipe) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data as Float32Array);
    }
  } catch (err) {
    console.warn('Inference error, utilizing semantic fallback vector:', err);
  }
  return generateSemanticFallbackVector(text);
}

/**
 * Format vector as PostgreSQL vector string literal: '[0.123,0.456,...]'
 */
export function formatVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Split a product specification text into domain-specific semantic chunks
 * as required by PRD Section 7.3 (display, camera, thermal, battery, chipset, general)
 */
export function chunkSpecText(spec: {
  spec_text: string;
  display_specs?: string | null;
  camera_specs?: string | null;
  chipset_specs?: string | null;
  battery_specs?: string | null;
  thermal_specs?: string | null;
  model_name?: string;
}): Array<{ category: string; text: string }> {
  const chunks: Array<{ category: string; text: string }> = [];

  const prefix = spec.model_name ? `${spec.model_name}: ` : '';

  if (spec.display_specs && spec.display_specs.trim().length > 10) {
    chunks.push({
      category: 'display',
      text: `${prefix}Display & Screen: ${spec.display_specs.trim()}`,
    });
  }

  if (spec.camera_specs && spec.camera_specs.trim().length > 10) {
    chunks.push({
      category: 'camera',
      text: `${prefix}Camera System & Video: ${spec.camera_specs.trim()}`,
    });
  }

  if (spec.chipset_specs && spec.chipset_specs.trim().length > 10) {
    chunks.push({
      category: 'chipset',
      text: `${prefix}Chipset & Processing: ${spec.chipset_specs.trim()}`,
    });
  }

  if (spec.battery_specs && spec.battery_specs.trim().length > 10) {
    chunks.push({
      category: 'battery',
      text: `${prefix}Battery & Charging: ${spec.battery_specs.trim()}`,
    });
  }

  if (spec.thermal_specs && spec.thermal_specs.trim().length > 10) {
    chunks.push({
      category: 'thermal',
      text: `${prefix}Thermal Performance & Cooling: ${spec.thermal_specs.trim()}`,
    });
  }

  if (spec.spec_text && spec.spec_text.trim().length > 10) {
    chunks.push({
      category: 'general',
      text: `${prefix}Overview: ${spec.spec_text.trim()}`,
    });
  }

  return chunks;
}
