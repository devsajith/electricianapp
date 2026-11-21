export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastStore {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.toasts];
    this.listeners.forEach((l) => l(copy));
  }

  public show(item: Omit<ToastItem, "id">) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      ...item,
      id,
      duration: item.duration ?? 4000,
    };
    // Keep max 5 toasts visible at once
    this.toasts = [newToast, ...this.toasts].slice(0, 5);
    this.notify();

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.duration);
    }
    return id;
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastStore = new ToastStore();

export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    toastStore.show({ type: "success", message, title, duration }),
  error: (message: string, title?: string, duration?: number) =>
    toastStore.show({ type: "error", message, title, duration }),
  warning: (message: string, title?: string, duration?: number) =>
    toastStore.show({ type: "warning", message, title, duration }),
  info: (message: string, title?: string, duration?: number) =>
    toastStore.show({ type: "info", message, title, duration }),
  dismiss: (id: string) => toastStore.dismiss(id),
  clear: () => toastStore.clear(),
};
