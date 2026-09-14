import { NextRequest, NextResponse } from "next/server";
import {
  getProjectByIdService,
  updateProjectService,
  deleteProjectService,
  UpdateProjectDTO,
} from "@/services/project.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id
 * Retrieve a project by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { data, error } = await getProjectByIdService(id);

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error || "Project not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: true, data },
    { status: 200 }
  );
}

/**
 * PATCH /api/projects/:id
 * Update project record
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateProjectDTO = await request.json();

    const { data, error } = await updateProjectService(id, body);

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error || "Failed to update project." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Project updated successfully.", data },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid payload.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/projects/:id
 * Delete project record
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { success, error } = await deleteProjectService(id);

  if (error || !success) {
    return NextResponse.json(
      { success: false, error: error || "Failed to delete project." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: true, message: `Project ${id} deleted successfully.` },
    { status: 200 }
  );
}
