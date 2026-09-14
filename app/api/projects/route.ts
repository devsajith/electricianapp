import { NextRequest, NextResponse } from "next/server";
import {
  createProjectService,
  getProjectsService,
  CreateProjectDTO,
} from "@/services/project.service";

/**
 * GET /api/projects
 * List all projects from Supabase
 */
export async function GET() {
  const { data, error } = await getProjectsService();

  if (error) {
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, count: data?.length || 0, data },
    { status: 200 }
  );
}

/**
 * POST /api/projects
 * Input/Create a new project in Supabase projects table
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectDTO = await request.json();

    if (!body.customer_name || typeof body.customer_name !== "string" || !body.customer_name.trim()) {
      return NextResponse.json(
        { success: false, error: "customer_name is required." },
        { status: 400 }
      );
    }

    const { data, error } = await createProjectService(body);

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
