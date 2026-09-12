import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { formatDate } from "@/lib/format";
import type { AuditItem } from "@/lib/types";

export function AuditView({
  items,
  onRefresh,
}: {
  items: AuditItem[];
  onRefresh: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Audit log"
        description="A durable record of changes made across this project."
        action={
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCwIcon />
            Refresh log
          </Button>
        }
      />
      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>No audit events yet</EmptyTitle>
          <EmptyDescription>Project activity will be recorded here.</EmptyDescription>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.action.replaceAll(".", " · ")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.entityType}{" "}
                  <code className="text-[11px]">{item.entityId}</code>
                </TableCell>
                <TableCell className="text-right text-[11px] whitespace-nowrap text-muted-foreground">
                  {formatDate(item.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
