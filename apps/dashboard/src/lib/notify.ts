import { toast } from "@/components/ui/toast";

export const notifySuccess = (title: string) => toast.add({ title, type: "success" });

export const notifyError = (title: string) => toast.add({ title, type: "error" });

export const notifyInfo = (title: string, description?: string) =>
  toast.add({ title, description, type: "info" });
