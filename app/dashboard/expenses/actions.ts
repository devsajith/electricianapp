"use server";

import { revalidatePath } from "next/cache";
import {
  getExpensesService,
  getExpensesByProjectIdService,
  createExpenseService,
  deleteExpenseService,
} from "@/services/expense.service";
import { Expense, CreateExpenseDTO } from "@/lib/types/expense";

/**
 * Server Action: Fetch all expenses
 */
export async function getExpensesAction(): Promise<{ data: Expense[]; error?: string }> {
  try {
    return await getExpensesService();
  } catch (err: unknown) {
    console.error("Error in getExpensesAction:", err);
    return { data: [], error: err instanceof Error ? err.message : "Failed to load expenses." };
  }
}

/**
 * Server Action: Fetch expenses for a specific project
 */
export async function getExpensesByProjectIdAction(
  projectId: string
): Promise<{ data: Expense[]; error?: string }> {
  try {
    return await getExpensesByProjectIdService(projectId);
  } catch (err: unknown) {
    console.error(`Error in getExpensesByProjectIdAction (${projectId}):`, err);
    return { data: [] };
  }
}

/**
 * Server Action: Record a new expense
 */
export async function createExpenseAction(
  input: CreateExpenseDTO
): Promise<{ data?: Expense; error?: string }> {
  try {
    const res = await createExpenseService(input);
    if (!res.error) {
      revalidatePath("/dashboard/expenses");
      revalidatePath("/dashboard/projects");
    }
    return res;
  } catch (err: unknown) {
    console.error("Error in createExpenseAction:", err);
    return { error: err instanceof Error ? err.message : "Failed to record expense." };
  }
}

/**
 * Server Action: Delete an expense record
 */
export async function deleteExpenseAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await deleteExpenseService(id);
    if (res.success) {
      revalidatePath("/dashboard/expenses");
      revalidatePath("/dashboard/projects");
    }
    return res;
  } catch (err: unknown) {
    console.error(`Error in deleteExpenseAction (${id}):`, err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete expense." };
  }
}
