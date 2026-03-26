"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { Id } from "@/convex/_generated/dataModel";

interface RejectDialogProps {
  transferId: Id<"transfers"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RejectDialog({
  transferId,
  open,
  onOpenChange,
}: RejectDialogProps) {
  const [comment, setComment] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // M1 fix: reset comment whenever dialog closes (covers ESC key, not just Cancel button)
  useEffect(() => {
    if (!open) setComment("");
  }, [open]);

  const rejectTransfer = useMutation(
    api.mutations.rejectTransfer.rejectTransfer
  );

  async function handleReject() {
    if (!transferId) return;
    setIsRejecting(true);
    try {
      await rejectTransfer({
        transferId,
        adminComment: comment.trim() || undefined,
      });
      toast.success("Transfer rejected.");
      setComment("");
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reject transfer.";
      toast.error(message);
    } finally {
      setIsRejecting(false);
    }
  }

  function handleCancel() {
    setComment("");
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Transfer Request</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The requesting Branch Manager will see
            your rejection reason.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5 py-2">
          <Label htmlFor="reject-comment">
            Rejection Reason{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="reject-comment"
            placeholder="e.g. Insufficient justification, stock needed locally..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isRejecting}
            onClick={handleReject}
          >
            {isRejecting ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
