"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Undo2, Bot, AlertTriangle, CheckCircle2, Clock, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  "auto-executed": { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle2, label: "Auto-Executed" },
  flagged: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: AlertTriangle, label: "Needs Review" },
  approved: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Check, label: "Approved" },
  rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: X, label: "Rejected" },
  undone: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: Undo2, label: "Undone" },
};

const actionTypeLabels: Record<string, string> = {
  markdown: "Markdown",
  replenishment: "Replenishment",
  allocation: "Allocation",
  transfer: "Transfer",
};

export default function AutonomousDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"flagged" | "all">("flagged");

  const flagged = useQuery(api.queries.listAutonomousActions.listAutonomousActions, { status: "flagged" });
  const all = useQuery(api.queries.listAutonomousActions.listAutonomousActions, {});

  const approve = useMutation(api.mutations.resolveAutonomousAction.approveAutonomousAction);
  const reject = useMutation(api.mutations.resolveAutonomousAction.rejectAutonomousAction);
  const undo = useMutation(api.mutations.undoAutonomousAction.undoAutonomousAction);

  const handleAction = async (fn: (args: { actionId: Id<"autonomousActions"> }) => Promise<void>, id: Id<"autonomousActions">, label: string) => {
    try {
      await fn({ actionId: id });
      toast({ title: label });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const autoCount = all?.filter((a) => a.status === "auto-executed").length ?? 0;
  const flaggedCount = flagged?.length ?? 0;
  const approvedCount = all?.filter((a) => a.status === "approved").length ?? 0;
  const rejectedCount = all?.filter((a) => a.status === "rejected").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Autonomous Engine</h1>
            <p className="text-sm text-muted-foreground">System actions executed automatically within guardrail limits</p>
          </div>
        </div>
        <Link href="/autonomous/settings">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Guardrails
          </Button>
        </Link>
      </div>

      {/* Explanation */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How does the Autonomous Engine work?</p>
        <p>The system evaluates inventory rules daily (replenishment, markdowns, allocations, transfers). If an action falls <strong>within your guardrail limits</strong>, it executes automatically. If it <strong>exceeds a limit</strong>, it gets flagged here for your review. You can approve, reject, or undo any action.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Auto-Executed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{autoCount}</p>
            <p className="text-xs text-muted-foreground">Within guardrail limits</p>
          </CardContent>
        </Card>
        <Card className={flaggedCount > 0 ? "border-amber-200 dark:border-amber-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Needs Review</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${flaggedCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${flaggedCount > 0 ? "text-amber-600" : ""}`}>{flaggedCount}</p>
            <p className="text-xs text-muted-foreground">Exceeded guardrail limits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Approved</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Manually approved by admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{all?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">{rejectedCount} rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        <button
          onClick={() => setActiveTab("flagged")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "flagged"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Exception Queue {flaggedCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">{flaggedCount}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Actions
        </button>
      </div>

      {/* Exception Queue */}
      {activeTab === "flagged" && (
        <>
          {flagged === undefined ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : flagged.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
              <p className="font-medium">All clear</p>
              <p className="text-sm text-muted-foreground">No exceptions pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flagged.map((a) => (
                <div key={a._id} className="flex items-start gap-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{actionTypeLabels[a.actionType] ?? a.actionType}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.executedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{a.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Guardrail: <span className="font-medium">{a.guardrailCheck}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                      onClick={() => handleAction(approve, a._id, "Action approved and executed")}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => handleAction(reject, a._id, "Action rejected")}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* All Actions */}
      {activeTab === "all" && (
        <>
          {all === undefined ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : all.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Bot className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No actions yet</p>
              <p className="text-sm text-muted-foreground">The autonomous engine has not executed any actions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Guardrail</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((a) => {
                  const config = statusConfig[a.status];
                  return (
                    <TableRow key={a._id}>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{actionTypeLabels[a.actionType] ?? a.actionType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={config?.color ?? ""}>
                          {config?.label ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] text-sm">{a.details}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">{a.guardrailCheck}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.executedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {a.status === "auto-executed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(undo, a._id, "Action undone")}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            <Undo2 className="mr-1 h-3.5 w-3.5" />
                            Undo
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
