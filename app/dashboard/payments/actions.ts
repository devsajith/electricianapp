"use server";

import { revalidatePath } from "next/cache";
import {
  getPaymentsService,
  getPaymentsByProjectIdService,
  createPaymentService,
  deletePaymentService,
} from "@/services/payment.service";
import { CreatePaymentDTO, Payment } from "@/lib/types/payment";

export async function getPaymentsAction(): Promise<{ data: Payment[]; error?: string }> {
  try {
    return await getPaymentsService();
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Error fetching payments" };
  }
}

export async function getProjectPaymentsAction(
  projectId: string
): Promise<{ data: Payment[]; error?: string }> {
  try {
    return await getPaymentsByProjectIdService(projectId);
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Error fetching project payments" };
  }
}

export async function recordPaymentAction(
  dto: CreatePaymentDTO
): Promise<{ data?: Payment; error?: string }> {
  try {
    if (!dto.project_id) {
      return { error: "Please select a project for this payment." };
    }
    if (!dto.amount || Number(dto.amount) <= 0) {
      return { error: "Please enter a valid payment amount greater than zero." };
    }
    if (!dto.payment_type) {
      dto.payment_type = "Advance";
    }

    const res = await createPaymentService(dto);

    if (res.data) {
      revalidatePath("/dashboard/payments");
      revalidatePath("/dashboard/projects");
      revalidatePath("/dashboard");
    }

    return res;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error recording payment" };
  }
}

export async function deletePaymentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await deletePaymentService(id);
    if (res.success) {
      revalidatePath("/dashboard/payments");
      revalidatePath("/dashboard/projects");
      revalidatePath("/dashboard");
    }
    return res;
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete payment" };
  }
}
