import { getMaterialsService } from "@/services/material.service";
import { Material, initialSampleMaterials } from "@/lib/types/material";
import MaterialsClient from "./materials-client";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  let materials: Material[] = [];

  try {
    const result = await withTimeout(
      getMaterialsService(),
      { data: initialSampleMaterials },
      2500
    );
    if (result.data && Array.isArray(result.data)) {
      materials = result.data;
    }
  } catch (err) {
    console.error("[MaterialsPage] Failed to fetch materials:", err);
    materials = initialSampleMaterials;
  }

  // Sanitize every row before passing to client
  const safeMaterials = (materials || [])
    .filter((item) => item !== null && item !== undefined)
    .map((item) => ({
      id: String(item.id ?? ""),
      item_name: String(item.item_name ?? ""),
      category: String(item.category ?? "General"),
      brand: item.brand != null ? String(item.brand) : null,
      unit: String(item.unit ?? "No"),
      default_price: Number(item.default_price ?? 0),
      supplier: item.supplier != null ? String(item.supplier) : null,
      notes: item.notes != null ? String(item.notes) : null,
      is_active: Boolean(item.is_active),
      created_at: String(item.created_at ?? new Date().toISOString()),
    }));

  return <MaterialsClient initialMaterials={safeMaterials} />;
}
