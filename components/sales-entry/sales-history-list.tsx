"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditSalesEntryForm } from "./edit-sales-entry-form";
import type { UpdateSalesEntryFormValues } from "@/lib/validations/sales-entry-edit";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type SalesEntryWithProduct = Doc<"salesEntries"> & {
  product: Doc<"products"> | null;
  enteredByName: string;
};

export function SalesHistoryList() {
  const entries = useQuery(api.queries.listMySalesEntries.listMySalesEntries, {});
  const updateSalesEntry = useMutation(
    api.mutations.updateSalesEntry.updateSalesEntry
  );
  const deleteSalesEntry = useMutation(
    api.mutations.deleteSalesEntry.deleteSalesEntry
  );

  const [editingId, setEditingId] = useState<Id<"salesEntries"> | null>(null);

  async function handleUpdate(
    salesEntryId: Id<"salesEntries">,
    values: UpdateSalesEntryFormValues
  ) {
    try {
      await updateSalesEntry({
        salesEntryId,
        quantitySold: values.quantitySold,
        notes: values.notes || undefined,
      });
      toast.success("Entry updated");
      setEditingId(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update entry.";
      toast.error(message);
    }
  }

  async function handleDelete(salesEntryId: Id<"salesEntries">) {
    try {
      await deleteSalesEntry({ salesEntryId });
      toast.success("Entry removed");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to remove entry.";
      toast.error(message);
    }
  }

  // Loading state: entries is undefined while Convex query is in-flight
  if (entries === undefined) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Today&apos;s Sales</h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Today&apos;s Sales</h2>
        <span className="text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? "item" : "items"} logged today
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No sales logged today. Use the search above to log your first sale.
        </p>
      ) : (
        <ul className="space-y-2" role="list">
          {(entries as SalesEntryWithProduct[]).map((entry) => (
            <li
              key={entry._id}
              className="flex items-start justify-between rounded-lg border bg-card p-3 gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium">
                    {entry.product?.styleCode ?? "—"}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {entry.product?.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="tabular-nums">
                    Qty:{" "}
                    <span className="font-medium">{entry.quantitySold}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format(entry.salePrice / 100)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Intl.DateTimeFormat("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    }).format(new Date(entry.enteredAt))}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {entry.notes}
                  </p>
                )}
                {entry.enteredByName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {entry.enteredByName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Edit Sheet — per-row, only one open at a time via editingId state */}
                <Sheet
                  open={editingId === entry._id}
                  onOpenChange={(open) =>
                    setEditingId(open ? entry._id : null)
                  }
                >
                  <SheetTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit entry for ${entry.product?.styleCode ?? "product"}`}
                      />
                    }
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>
                        Edit Entry —{" "}
                        <span className="font-mono">
                          {entry.product?.styleCode ?? ""}
                        </span>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 px-4">
                      <EditSalesEntryForm
                        defaultValues={{
                          quantitySold: entry.quantitySold,
                          notes: entry.notes ?? "",
                        }}
                        salePrice={entry.salePrice}
                        productName={entry.product?.name ?? ""}
                        onSubmit={(values) => handleUpdate(entry._id, values)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Delete AlertDialog — confirmation required before deletion */}
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete entry for ${entry.product?.styleCode ?? "product"}`}
                      />
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove this entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove{" "}
                        <span className="font-mono font-medium">
                          {entry.product?.styleCode}
                        </span>{" "}
                        &times; {entry.quantitySold} from today&apos;s sales and
                        restore {entry.quantitySold}{" "}
                        {entry.quantitySold !== 1 ? "units" : "unit"} to stock.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(entry._id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove Entry
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
