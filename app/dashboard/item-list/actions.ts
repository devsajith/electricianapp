"use server";

export async function getAllProjectItemListsAction() {
  return [];
}

export async function getProjectItemListByIdAction(id: string) {
  void id;
  return null;
}

export async function createProjectItemListAction(input: Record<string, unknown>) {
  void input;
  return { error: "Coming soon" };
}

export async function updateProjectItemListStatusAction(id: string, status: string) {
  void id;
  void status;
  return { success: true };
}
