"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Loader2, Plus, Search, Trash2, X } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  acknowledged: "bg-purple-100 text-purple-800",
  shipped: "bg-amber-100 text-amber-800",
  received: "bg-green-100 text-green-800",
  closed: "bg-green-200 text-green-900",
  cancelled: "bg-red-100 text-red-800",
};

const NEXT_STATUS: Record<string, string> = {
  draft: "sent",
  sent: "acknowledged",
  acknowledged: "shipped",
  shipped: "received",
  received: "closed",
};

function formatCurrency(centavos: number) {
  return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const orders = useQuery(api.queries.listPurchaseOrders.listPurchaseOrders, {
    status: statusFilter || undefined,
  });
  const suppliers = useQuery(api.queries.listSuppliers2.listSuppliers2, {});
  const products = useQuery(api.queries.listProducts.listProducts, {});

  const updateStatus = useMutation(api.mutations.purchaseOrders.updatePOStatus);
  const cancelPO = useMutation(api.mutations.purchaseOrders.cancelPO);
  const createPO = useMutation(api.mutations.createManualPO.createManualPO);

  const handleAdvance = async (poId: Id<"purchaseOrders">, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await updateStatus({ poId, newStatus: next });
      toast({ title: `PO advanced to ${next}` });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const handleCancel = async (poId: Id<"purchaseOrders">) => {
    try {
      await cancelPO({ poId });
      toast({ title: "PO cancelled" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  if (orders === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1></div>
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  const totalValue = orders.reduce((sum, po) => sum + po.totalCostCentavos, 0);
  const activeCount = orders.filter((po) => !["closed", "cancelled"].includes(po.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Track and manage supplier purchase orders</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      <CreatePODialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        suppliers={suppliers ?? []}
        products={products ?? []}
        onSubmit={async (supplierId, items) => {
          await createPO({ supplierId: supplierId as Id<"suppliers">, items: items.map(i => ({ productId: i.productId as Id<"products">, quantity: i.quantity })) });
          toast({ title: "Purchase order created" });
          setCreateOpen(false);
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Orders</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{orders.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Active</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{activeCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Value</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by PO number or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(statusColors).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {(() => {
        const filteredOrders = orders.filter((po) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return (
            po.supplierName?.toLowerCase().includes(q) ||
            po.itemsSummary.some(
              (item) =>
                item.productName?.toLowerCase().includes(q) ||
                item.productSku?.toLowerCase().includes(q)
            )
          );
        });
        return filteredOrders.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No purchase orders found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((po) => (
              <TableRow key={po._id}>
                <TableCell className="font-medium">{po.supplierName}</TableCell>
                <TableCell>
                  {po.itemsSummary.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {item.productImageUrl ? (
                        <img src={item.productImageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                          {(item.productSku ?? "").slice(-3)}
                        </div>
                      )}
                      {item.productName} <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                  ))}
                </TableCell>
                <TableCell><Badge variant="secondary" className={statusColors[po.status] ?? ""}>{po.status}</Badge></TableCell>
                <TableCell className="text-right">{formatCurrency(po.totalCostCentavos)}</TableCell>
                <TableCell><Badge variant="secondary" className={po.triggeredBy === "auto" ? "bg-purple-100 text-purple-800" : ""}>{po.triggeredBy}</Badge></TableCell>
                <TableCell className="text-sm">{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {NEXT_STATUS[po.status] && (
                      <Button variant="ghost" size="sm" onClick={() => handleAdvance(po._id, po.status)} title={`Advance to ${NEXT_STATUS[po.status]}`}>
                        <ChevronRight className="h-4 w-4" /> {NEXT_STATUS[po.status]}
                      </Button>
                    )}
                    {!["shipped", "received", "closed", "cancelled"].includes(po.status) && (
                      <Button variant="ghost" size="icon" onClick={() => handleCancel(po._id)} title="Cancel">
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
      })()}
    </div>
  );
}

// --- Create PO Dialog ---

type POItem = { productId: string; quantity: number };

function CreatePODialog({
  open,
  onOpenChange,
  suppliers,
  products,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Array<{ _id: string; name: string }>;
  products: Array<{ _id: string; styleCode: string; name: string; unitCost: number }>;
  onSubmit: (supplierId: string, items: POItem[]) => Promise<void>;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<POItem[]>([{ productId: "", quantity: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addItem = () => setItems([...items, { productId: "", quantity: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof POItem, value: string | number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const totalCost = items.reduce((sum, item) => {
    const product = products.find((p) => p._id === item.productId);
    return sum + (product?.unitCost ?? 0) * item.quantity;
  }, 0);

  const validItems = items.filter((i) => i.productId && i.quantity > 0);

  const handleSubmit = async () => {
    setError("");
    if (!supplierId) { setError("Select a supplier."); return; }
    if (validItems.length === 0) { setError("Add at least one item."); return; }
    setSubmitting(true);
    try {
      await onSubmit(supplierId, validItems);
      setSupplierId("");
      setItems([{ productId: "", quantity: 0 }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button variant="outline" size="sm" onClick={addItem} type="button">
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select value={item.productId || "none"} onValueChange={(v) => updateItem(idx, "productId", v === "none" ? "" : v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select product</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.styleCode} — {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-24"
                    placeholder="Qty"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm">
              <span className="text-muted-foreground">{validItems.length} item{validItems.length !== 1 ? "s" : ""}</span>
              <span className="ml-3 font-medium">Total: ₱{(totalCost / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create PO
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
