import { NextRequest, NextResponse } from "next/server";
import {
  createProjectService,
  getProjectsService,
  CreateProjectDTO,
} from "@/services/project.service";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
};

/**
 * GET /api/projects
 * List all projects from Supabase with performance headers
 */
export async function GET() {
  const { data, error } = await getProjectsService();

  if (error) {
    return NextResponse.json(
      { success: false, error },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    { success: true, count: data?.length || 0, data },
    { status: 200, headers: NO_CACHE_HEADERS }
  );
}

/**
 * POST /api/projects
 * Input/Create a new project in Supabase projects table
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectDTO = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const trimmedName = typeof body.name === "string" ? body.name.trim() : "";
    if (!trimmedName) {
      return NextResponse.json(
        { success: false, error: "name is required." },
        { status: 400 }
      );
    }

    const { data, error } = await createProjectService({
      ...body,
      name: trimmedName,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully in Supabase.",
        data,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON payload.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
