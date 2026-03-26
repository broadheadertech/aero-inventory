"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";

export default function RegionsPage() {
  const { toast } = useToast();
  const regions = useQuery(api.queries.regionQueries.listRegions, {});
  const rates = useQuery(api.queries.regionQueries.listExchangeRates, {});
  const createRegion = useMutation(api.mutations.regions.createRegion);
  const deleteRegion = useMutation(api.mutations.regions.deleteRegion);

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [timezone, setTimezone] = useState("");
  const [locale, setLocale] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRegion({ name, countryCode, currencyCode, timezone, locale });
      toast({ title: "Region created" });
      setFormOpen(false);
      setName(""); setCountryCode(""); setCurrencyCode(""); setTimezone(""); setLocale("");
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (regions === undefined) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Regions</h1></div>
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regions</h1>
          <p className="text-muted-foreground">Manage multi-country regions and currencies</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Region</Button>
      </div>

      {regions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No regions configured. Add your first region to enable multi-country support.</p>
      ) : (
        <>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by region name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Region</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Timezone</TableHead>
              <TableHead>Exchange Rate (to PHP)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.filter((r) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                r.name?.toLowerCase().includes(q) ||
                r.countryCode?.toLowerCase().includes(q) ||
                r.currencyCode?.toLowerCase().includes(q)
              );
            }).map((r) => {
              const rate = rates?.find((rt) => rt.fromCurrency === r.currencyCode && rt.toCurrency === "PHP");
              return (
                <TableRow key={r._id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.countryCode}</TableCell>
                  <TableCell><Badge variant="secondary">{r.currencyCode}</Badge></TableCell>
                  <TableCell className="text-sm">{r.timezone}</TableCell>
                  <TableCell>{rate ? `1 ${r.currencyCode} = ₱${rate.rate.toFixed(4)}` : r.currencyCode === "PHP" ? "Base currency" : "Not set"}</TableCell>
                  <TableCell><Badge variant="secondary" className={r.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{r.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { deleteRegion({ regionId: r._id }); toast({ title: "Region deleted" }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Region</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Region Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vietnam" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Country Code (ISO)</Label><Input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="VN" required /></div>
              <div><Label>Currency Code</Label><Input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} placeholder="VND" required /></div>
            </div>
            <div><Label>Timezone (IANA)</Label><Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Ho_Chi_Minh" required /></div>
            <div><Label>Locale</Label><Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="vi-VN" required /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
