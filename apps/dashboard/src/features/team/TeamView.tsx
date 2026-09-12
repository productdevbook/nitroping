import { useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { MemberItem } from "@/lib/types";
import { useConfirm } from "@/hooks/useConfirm";

const roles = ["member", "admin", "moderator", "viewer", "billing_admin"];

export function TeamView({
  members,
  organizationId,
  credentials,
  onRefresh,
}: {
  members: MemberItem[];
  organizationId: string;
  credentials: ApiOptions;
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [sending, setSending] = useState(false);
  const confirm = useConfirm();

  const invite = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      await api(`/dashboard/organizations/${organizationId}/invites`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setEmail("");
      notifySuccess("Invitation sent");
      onRefresh();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to send the invitation"));
    } finally {
      setSending(false);
    }
  };

  const remove = async (member: MemberItem) => {
    const confirmed = await confirm({
      title: "Remove this teammate?",
      description: `${member.email} loses access to this workspace immediately.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api(
        `/dashboard/organizations/${organizationId}/members/${member.userId}`,
        { ...credentials, method: "DELETE" },
      );
      notifySuccess("Teammate removed");
      onRefresh();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to remove the teammate"));
    }
  };

  return (
    <>
      <PageHeader
        title="Team"
        description="Invite collaborators and keep project access explicit."
        action={
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCwIcon />
            Refresh team
          </Button>
        }
      />

      <section className="max-w-[720px]">
        <SectionHeader
          title="Invite a teammate"
          description="Invitations expire after seven days and are restricted to the invited email."
        />
        <form
          className="flex flex-wrap items-center gap-2 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            void invite();
          }}
        >
          <Input
            type="email"
            className="w-56"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@company.com"
          />
          <NativeSelect
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label="Role"
          >
            {roles.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option.replaceAll("_", " ")}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="submit" disabled={sending || !email.trim()}>
            {sending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      </section>

      <section className="mt-6">
        <SectionHeader title="Members" description={`${members.length} people`} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell className="font-medium">{member.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {member.role.replaceAll("_", " ")}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {formatDate(member.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  {member.role === "owner" ? (
                    <span className="text-[11px] text-muted-foreground">Owner</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => void remove(member)}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
