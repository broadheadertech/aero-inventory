"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { supplierSchema, type SupplierFormValues } from "@/lib/validations/supplier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type SupplierFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSupplier?: Doc<"suppliers"> | null;
};

export function SupplierForm({ open, onOpenChange, editingSupplier }: SupplierFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSupplier = useMutation(api.mutations.createSupplier.createSupplier);
  const updateSupplier = useMutation(api.mutations.updateSupplier.updateSupplier);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", contactName: "", contactEmail: "", leadTimeDays: 7, productsSupplied: [], isActive: true },
  });

  useEffect(() => {
    if (editingSupplier) {
      form.reset({
        name: editingSupplier.name,
        contactName: editingSupplier.contactName,
        contactEmail: editingSupplier.contactEmail,
        phone: editingSupplier.phone ?? "",
        leadTimeDays: editingSupplier.leadTimeDays,
        productsSupplied: editingSupplier.productsSupplied as string[],
        isActive: editingSupplier.isActive,
      });
    } else {
      form.reset({ name: "", contactName: "", contactEmail: "", leadTimeDays: 7, productsSupplied: [], isActive: true });
    }
  }, [editingSupplier, form]);

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await updateSupplier({
          supplierId: editingSupplier._id,
          ...values,
          phone: values.phone || undefined,
          productsSupplied: values.productsSupplied as Id<"products">[],
        });
        toast({ title: "Supplier updated successfully" });
      } else {
        await createSupplier({
          ...values,
          phone: values.phone || undefined,
          productsSupplied: values.productsSupplied as Id<"products">[],
        });
        toast({ title: "Supplier created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input placeholder="e.g. Pacific Threads" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="contactName" render={({ field }) => (
                <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone (optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="leadTimeDays" render={({ field }) => (
                <FormItem><FormLabel>Lead Time (days)</FormLabel><FormControl><Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSupplier ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
