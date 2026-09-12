import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toast";
import { followSystemTheme } from "@/lib/systemTheme";
import { PortalApp } from "@/portal/PortalApp";
import "./styles/public.css";

followSystemTheme();

createRoot(document.getElementById("root")!).render(
  <Toaster>
    <PortalApp />
  </Toaster>,
);
