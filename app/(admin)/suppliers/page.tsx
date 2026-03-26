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
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SuppliersPage() {
  const { toast } = useToast();
  const suppliers = useQuery(api.queries.listSuppliers2.listSuppliers2, {});
  const deleteSupplier = useMutation(api.mutations.deleteSupplier.deleteSupplier);

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Doc<"suppliers"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"suppliers"> | null>(null);

  const handleEdit = (supplier: Doc<"suppliers">) => { setEditingSupplier(supplier); setFormOpen(true); };
  const handleCreate = () => { setEditingSupplier(null); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSupplier({ supplierId: deleteTarget._id });
      toast({ title: "Supplier deleted" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setDeleteTarget(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage supplier directory and track performance</p>
        </div>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Add Supplier</Button>
      </div>

      {suppliers === undefined ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No suppliers yet.</p>
        </div>
      ) : (
        <>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Lead Time</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.filter((s) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                s.name?.toLowerCase().includes(q) ||
                s.contactName?.toLowerCase().includes(q)
              );
            }).map((s) => (
              <TableRow key={s._id}>
                <TableCell className="font-medium"><Link href={`/suppliers/${s._id}`} className="hover:underline">{s.name}</Link></TableCell>
                <TableCell>{s.contactName} ({s.contactEmail})</TableCell>
                <TableCell className="text-right">{s.leadTimeDays}d</TableCell>
                <TableCell className="text-right">{s.productsSupplied.length}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </>
      )}

      <SupplierForm open={formOpen} onOpenChange={setFormOpen} editingSupplier={editingSupplier} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
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
