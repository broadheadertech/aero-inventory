"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type PosConfigFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PosConfigForm({ open, onOpenChange }: PosConfigFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const branches = useQuery(api.queries.listBranches.listBranches, {});
  const createConfig = useMutation(api.mutations.posConfig.createPosConfig);

  const [branchId, setBranchId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    setWebhookSecret(Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join(""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createConfig({ branchId: branchId as Id<"branches">, webhookSecret, isEnabled });
      toast({ title: "POS config created" });
      onOpenChange(false);
      setBranchId(""); setWebhookSecret(""); setIsEnabled(true);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add POS Configuration</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches?.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Webhook Secret</Label>
            <div className="flex gap-2">
              <Input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="HMAC secret" required className="font-mono text-xs" />
              <Button type="button" variant="outline" size="sm" onClick={generateSecret}>Generate</Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            <Label>{isEnabled ? "Enabled" : "Disabled"}</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !branchId || !webhookSecret}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
