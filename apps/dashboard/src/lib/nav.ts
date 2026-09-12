import {
  BellIcon,
  ChartColumnIcon,
  CodeIcon,
  CreditCardIcon,
  InboxIcon,
  LayoutTemplateIcon,
  LockIcon,
  MapIcon,
  MegaphoneIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type View =
  | "inbox"
  | "insights"
  | "moderation"
  | "roadmap"
  | "changelog"
  | "audit"
  | "developer"
  | "team"
  | "notifications"
  | "billing"
  | "widget"
  | "settings"
  | "privacy";

export type NavEntry = { id: View; label: string; icon: LucideIcon };

export const navSections: Array<{ label: string; items: NavEntry[] }> = [
  {
    label: "Workspace",
    items: [
      { id: "inbox", label: "Inbox", icon: InboxIcon },
      { id: "insights", label: "Insights", icon: ChartColumnIcon },
      { id: "moderation", label: "Moderation", icon: ShieldCheckIcon },
    ],
  },
  {
    label: "Product",
    items: [
      { id: "roadmap", label: "Roadmap", icon: MapIcon },
      { id: "changelog", label: "Changelog", icon: MegaphoneIcon },
      { id: "audit", label: "Audit log", icon: ScrollTextIcon },
      { id: "developer", label: "Developer", icon: CodeIcon },
      { id: "team", label: "Team", icon: UsersIcon },
      { id: "notifications", label: "Notifications", icon: BellIcon },
      { id: "billing", label: "Billing & usage", icon: CreditCardIcon },
    ],
  },
  {
    label: "Manage",
    items: [
      { id: "widget", label: "Widget builder", icon: LayoutTemplateIcon },
      { id: "settings", label: "Project settings", icon: SettingsIcon },
      { id: "privacy", label: "Privacy & data", icon: LockIcon },
    ],
  },
];

export const viewLabel = (view: View): string =>
  navSections.flatMap((section) => section.items).find((item) => item.id === view)
    ?.label ?? "Inbox";
