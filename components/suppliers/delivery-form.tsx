"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type DeliveryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: Id<"suppliers">;
};

export function DeliveryForm({ open, onOpenChange, supplierId }: DeliveryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recordDelivery = useMutation(api.mutations.recordDelivery.recordDelivery);

  const [promisedDate, setPromisedDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [quantityOrdered, setQuantityOrdered] = useState("");
  const [quantityReceived, setQuantityReceived] = useState("");
  const [qualityRejected, setQualityRejected] = useState("0");
  const [qualityNotes, setQualityNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await recordDelivery({
        supplierId,
        promisedDate,
        actualDate,
        quantityOrdered: Number(quantityOrdered),
        quantityReceived: Number(quantityReceived),
        qualityRejected: Number(qualityRejected),
        qualityNotes: qualityNotes || undefined,
      });
      toast({ title: "Delivery recorded" });
      onOpenChange(false);
      setPromisedDate(""); setActualDate(""); setQuantityOrdered(""); setQuantityReceived(""); setQualityRejected("0"); setQualityNotes("");
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Delivery</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Promised Date</Label><Input type="date" value={promisedDate} onChange={(e) => setPromisedDate(e.target.value)} required /></div>
            <div><Label>Actual Date</Label><Input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Qty Ordered</Label><Input type="number" min={1} value={quantityOrdered} onChange={(e) => setQuantityOrdered(e.target.value)} required /></div>
            <div><Label>Qty Received</Label><Input type="number" min={0} value={quantityReceived} onChange={(e) => setQuantityReceived(e.target.value)} required /></div>
          </div>
          <div><Label>Quality Rejected</Label><Input type="number" min={0} value={qualityRejected} onChange={(e) => setQualityRejected(e.target.value)} /></div>
          <div><Label>Quality Notes (optional)</Label><Textarea value={qualityNotes} onChange={(e) => setQualityNotes(e.target.value)} rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
