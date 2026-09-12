import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toast";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { followSystemTheme } from "@/lib/systemTheme";
import { FollowUpApp } from "@/follow-up/FollowUpApp";
import "./styles/public.css";

followSystemTheme();

createRoot(document.getElementById("root")!).render(
  <Toaster>
    <ConfirmProvider>
      <FollowUpApp />
    </ConfirmProvider>
  </Toaster>,
);
