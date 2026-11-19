import { getLabourBundleAction } from "../actions";
import { LabourDetailClient } from "./labour-detail-client";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LabourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getLabourBundleAction(id);

  if (!bundle.worker) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center py-16 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Worker Not Found</h2>
        <p className="text-xs text-slate-400">
          The labour record you requested does not exist or may have been removed.
        </p>
        <Link href="/dashboard/labour">
          <Button variant="outline" className="border-slate-800 text-xs text-slate-300">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Labour
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <LabourDetailClient
      id={id}
      initialWorker={bundle.worker}
      initialEntries={bundle.entries}
      initialProjects={bundle.projects}
    />
  );
}
