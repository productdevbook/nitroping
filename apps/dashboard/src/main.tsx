import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { App } from "@/app/App";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <Toaster>
    <TooltipProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </TooltipProvider>
  </Toaster>,
);
