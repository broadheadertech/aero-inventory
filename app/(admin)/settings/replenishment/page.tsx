"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RuleForm } from "@/components/replenishment/rule-form";
import { SCOPE_LABELS } from "@/components/replenishment/rule-constants";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function ReplenishmentRulesPage() {
  const { toast } = useToast();
  const rules = useQuery(api.queries.listReplenishmentRules.listReplenishmentRules, {});
  const toggleRule = useMutation(api.mutations.toggleReplenishmentRule.toggleReplenishmentRule);
  const deleteRule = useMutation(api.mutations.deleteReplenishmentRule.deleteReplenishmentRule);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Doc<"replenishmentRules"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"replenishmentRules"> | null>(null);

  const handleEdit = (rule: Doc<"replenishmentRules">) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  const handleToggle = async (ruleId: Doc<"replenishmentRules">["_id"]) => {
    try {
      await toggleRule({ ruleId });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle rule",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule({ ruleId: deleteTarget._id });
      toast({ title: "Rule deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete rule",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Replenishment Rules</h1>
          <p className="text-muted-foreground">
            Configure automatic stock monitoring and restock suggestions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {rules === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No replenishment rules configured.</p>
          <p className="text-sm text-muted-foreground">
            Create rules to automatically monitor stock levels.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead className="text-right">Coverage</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="text-right">Triggers</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule._id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{SCOPE_LABELS[rule.scope]}</Badge>
                </TableCell>
                <TableCell className="text-right">{rule.thresholdDays}d</TableCell>
                <TableCell className="text-right">{rule.coverageDays}d</TableCell>
                <TableCell>
                  <Switch
                    checked={rule.isEnabled}
                    onCheckedChange={() => handleToggle(rule._id)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {rule.pendingSuggestionCount > 0 ? (
                    <Badge variant="secondary">{rule.pendingSuggestionCount} pending</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(rule)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <RuleForm open={formOpen} onOpenChange={setFormOpen} editingRule={editingRule} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Replenishment Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
