"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MarkdownRuleForm } from "@/components/markdown/markdown-rule-form";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function MarkdownRulesPage() {
  const { toast } = useToast();
  const rules = useQuery(api.queries.listMarkdownRules.listMarkdownRules, {});
  const deleteRule = useMutation(api.mutations.markdownRules.deleteMarkdownRule);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Doc<"markdownRules"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"markdownRules"> | null>(null);

  const handleEdit = (rule: Doc<"markdownRules">) => { setEditingRule(rule); setFormOpen(true); };
  const handleCreate = () => { setEditingRule(null); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule({ ruleId: deleteTarget._id });
      toast({ title: "Rule deleted" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setDeleteTarget(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Markdown Rules</h1>
          <p className="text-muted-foreground">Configure automatic markdown scheduling rules</p>
        </div>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Add Rule</Button>
      </div>

      {rules === undefined ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : rules.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No markdown rules configured yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead className="text-right">Min Weeks</TableHead>
              <TableHead className="text-right">Markdown %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r._id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={r.classification === "Slow" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                    {r.classification}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{r.minWeeksOnFloor}w</TableCell>
                <TableCell className="text-right">{r.markdownPercent}%</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={r.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {r.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MarkdownRuleForm open={formOpen} onOpenChange={setFormOpen} editingRule={editingRule} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>Delete &quot;{deleteTarget?.name}&quot;? This cannot be undone.</AlertDialogDescription>
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
