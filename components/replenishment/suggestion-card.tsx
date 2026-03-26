"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Package, X, Loader2 } from "lucide-react";

type SuggestionCardProps = {
  suggestionId: Id<"replenishmentSuggestions">;
  styleCode: string;
  productName: string;
  branchName: string;
  currentSOH: number;
  currentADS: number;
  suggestedQuantity: number;
};

export function SuggestionCard({
  suggestionId,
  styleCode,
  productName,
  branchName,
  currentSOH,
  currentADS,
  suggestedQuantity,
}: SuggestionCardProps) {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const confirmSuggestion = useMutation(
    api.mutations.confirmReplenishmentSuggestion.confirmReplenishmentSuggestion
  );
  const dismissSuggestion = useMutation(
    api.mutations.dismissReplenishmentSuggestion.dismissReplenishmentSuggestion
  );

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmSuggestion({ suggestionId });
      toast({ title: "Transfer request created" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to confirm",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await dismissSuggestion({ suggestionId });
      toast({ title: "Suggestion dismissed" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dismiss",
        variant: "destructive",
      });
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Package className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <div className="font-medium">
                {styleCode} — {productName}
              </div>
              <div className="text-sm text-muted-foreground">{branchName}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="text-sm">
              <span>SOH: <span className="font-medium text-red-600">{currentSOH}</span></span>
              <span className="ml-3">ADS: <span className="font-medium">{currentADS.toFixed(1)}</span></span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-sm">
              Restock {suggestedQuantity}
            </Badge>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isConfirming || isDismissing}
              >
                {isConfirming ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1 h-4 w-4" />
                )}
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isConfirming || isDismissing}
              >
                {isDismissing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
