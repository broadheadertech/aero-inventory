"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type MarkdownRuleFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: Doc<"markdownRules"> | null;
};

export function MarkdownRuleForm({ open, onOpenChange, editingRule }: MarkdownRuleFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [classification, setClassification] = useState("Slow");
  const [minWeeksOnFloor, setMinWeeksOnFloor] = useState(4);
  const [markdownPercent, setMarkdownPercent] = useState(10);
  const [isEnabled, setIsEnabled] = useState(true);

  const createRule = useMutation(api.mutations.markdownRules.createMarkdownRule);
  const updateRule = useMutation(api.mutations.markdownRules.updateMarkdownRule);

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setClassification(editingRule.classification);
      setMinWeeksOnFloor(editingRule.minWeeksOnFloor);
      setMarkdownPercent(editingRule.markdownPercent);
      setIsEnabled(editingRule.isEnabled);
    } else {
      setName(""); setClassification("Slow"); setMinWeeksOnFloor(4); setMarkdownPercent(10); setIsEnabled(true);
    }
  }, [editingRule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRule) {
        await updateRule({ ruleId: editingRule._id, name, classification, minWeeksOnFloor, markdownPercent, isEnabled });
        toast({ title: "Rule updated" });
      } else {
        await createRule({ name, classification, minWeeksOnFloor, markdownPercent });
        toast({ title: "Rule created" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editingRule ? "Edit Rule" : "Add Markdown Rule"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Rule Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Classification</Label>
              <Select value={classification} onValueChange={setClassification}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Slow">Slow</SelectItem><SelectItem value="Mid">Mid</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Min Weeks on Floor</Label><Input type="number" min={1} value={minWeeksOnFloor} onChange={(e) => setMinWeeksOnFloor(Number(e.target.value))} /></div>
          </div>
          <div><Label>Markdown %</Label><Input type="number" min={1} max={100} value={markdownPercent} onChange={(e) => setMarkdownPercent(Number(e.target.value))} /></div>
          {editingRule && (
            <div className="flex items-center gap-2">
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
              <Label>{isEnabled ? "Enabled" : "Disabled"}</Label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingRule ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
