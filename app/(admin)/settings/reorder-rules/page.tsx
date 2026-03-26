"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";

export default function ReorderRulesPage() {
  const { toast } = useToast();
  const rules = useQuery(api.queries.listReorderRules.listReorderRules, {});
  const products = useQuery(api.queries.listProducts.listProducts, {});
  const suppliers = useQuery(api.queries.listSuppliers2.listSuppliers2, {});
  const upsert = useMutation(api.mutations.reorderRules.upsertReorderRule);
  const deleteRule = useMutation(api.mutations.reorderRules.deleteReorderRule);

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [bufferDays, setBufferDays] = useState("3");
  const [minQty, setMinQty] = useState("10");
  const [isEnabled, setIsEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !supplierId) return;
    setIsSubmitting(true);
    try {
      await upsert({
        productId: productId as Id<"products">,
        supplierId: supplierId as Id<"suppliers">,
        safetyBufferDays: Number(bufferDays),
        minOrderQuantity: Number(minQty),
        isEnabled,
      });
      toast({ title: "Reorder rule saved" });
      setFormOpen(false);
      setProductId(""); setSupplierId(""); setBufferDays("3"); setMinQty("10"); setIsEnabled(true);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (rules === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Reorder Rules</h1></div>
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reorder Rules</h1>
          <p className="text-muted-foreground">Configure automatic reorder points per product</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Rule</Button>
      </div>

      {rules.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No reorder rules configured yet.</p>
      ) : (
        <>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by product or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Lead Time</TableHead>
              <TableHead className="text-right">Buffer Days</TableHead>
              <TableHead className="text-right">Min Order Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.filter((r) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                r.productName?.toLowerCase().includes(q) ||
                r.productSku?.toLowerCase().includes(q) ||
                r.supplierName?.toLowerCase().includes(q)
              );
            }).map((r) => (
              <TableRow key={r._id}>
                <TableCell><span className="font-medium">{r.productName}</span><br /><span className="text-xs text-muted-foreground">{r.productSku}</span></TableCell>
                <TableCell>{r.supplierName}</TableCell>
                <TableCell className="text-right">{r.supplierLeadTime}d</TableCell>
                <TableCell className="text-right">{r.safetyBufferDays}d</TableCell>
                <TableCell className="text-right">{r.minOrderQuantity}</TableCell>
                <TableCell><Badge variant="secondary" className={r.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{r.isEnabled ? "Enabled" : "Disabled"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => deleteRule({ ruleId: r._id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Reorder Rule</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p._id} value={p._id}>{p.name} ({p.styleCode})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>{suppliers?.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Safety Buffer (days)</Label><Input type="number" min={0} value={bufferDays} onChange={(e) => setBufferDays(e.target.value)} /></div>
              <div><Label>Min Order Qty</Label><Input type="number" min={1} value={minQty} onChange={(e) => setMinQty(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} /><Label>{isEnabled ? "Enabled" : "Disabled"}</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !productId || !supplierId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
