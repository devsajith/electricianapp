import { getMaterialsService } from "@/services/material.service";
import { Material } from "@/lib/types/material";
import MaterialsClient, { SafeMaterial } from "./materials-client";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  let materials: Material[] = [];

  try {
    const result = await withTimeout(
      getMaterialsService(),
      { data: [] },
      2500
    );
    if (result.data && Array.isArray(result.data)) {
      materials = result.data;
    }
  } catch (err) {
    console.error("[MaterialsPage] Failed to fetch materials:", err);
    materials = [];
  }

  // Sanitize every row before passing to client
  const safeMaterials: SafeMaterial[] = (materials || [])
    .filter((item) => item !== null && item !== undefined)
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      brand: item.brand != null ? String(item.brand) : null,
      unit: String(item.unit ?? "No"),
      created_at: String(item.created_at ?? new Date().toISOString()),
    }));

  return <MaterialsClient initialMaterials={safeMaterials} />;
}
