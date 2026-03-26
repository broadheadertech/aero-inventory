"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

const actionIcons: Record<string, string> = {
  create_supplier: "Added supplier",
  update_supplier: "Updated supplier",
  delete_supplier: "Deleted supplier",
  record_delivery: "Recorded delivery",
  create_markdown_rule: "Created markdown rule",
  approve_markdown: "Approved markdown",
  create_pos_config: "Created POS config",
  update_po_status: "Updated PO status",
  create_po: "Created purchase order",
  cancel_po: "Cancelled purchase order",
  toggle_autonomous: "Toggled autonomous mode",
  approve_autonomous: "Approved autonomous action",
  undo_autonomous: "Undone autonomous action",
  submit_feedback: "Submitted feedback",
  create_reorder_rule: "Created reorder rule",
  update_reorder_rule: "Updated reorder rule",
  create_guardrail: "Created guardrail",
  update_guardrail: "Updated guardrail",
};

export function RecentActivity() {
  const activity = useQuery(api.queries.recentActivity.recentActivity, {});

  if (activity === undefined) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((log) => (
              <div key={log._id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{log.actorName}</span>
                    {" "}
                    <span className="text-muted-foreground">
                      {actionIcons[log.actionType] ?? log.actionType}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
