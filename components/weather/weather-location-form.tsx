"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type WeatherLocationFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocation?: Doc<"weatherLocations"> | null;
};

export function WeatherLocationForm({ open, onOpenChange, editingLocation }: WeatherLocationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const branches = useQuery(api.queries.listBranches.listBranches, {});

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const create = useMutation(api.mutations.weatherLocations.createWeatherLocation);
  const update = useMutation(api.mutations.weatherLocations.updateWeatherLocation);

  useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name);
      setLatitude(String(editingLocation.latitude));
      setLongitude(String(editingLocation.longitude));
      setSelectedBranches(editingLocation.branchIds as string[]);
    } else {
      setName(""); setLatitude(""); setLongitude(""); setSelectedBranches([]);
    }
  }, [editingLocation]);

  const toggleBranch = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const args = {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        branchIds: selectedBranches as Id<"branches">[],
      };
      if (editingLocation) {
        await update({ locationId: editingLocation._id, ...args, isActive: editingLocation.isActive });
        toast({ title: "Location updated" });
      } else {
        await create(args);
        toast({ title: "Location created" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editingLocation ? "Edit Location" : "Add Weather Location"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Location Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metro Manila" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Latitude</Label><Input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required /></div>
            <div><Label>Longitude</Label><Input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required /></div>
          </div>
          <div>
            <Label>Mapped Branches</Label>
            <div className="mt-2 space-y-1.5 max-h-40 overflow-auto rounded-md border p-2">
              {branches?.map((b) => (
                <label key={b._id} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(b._id)}
                    onChange={() => toggleBranch(b._id)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingLocation ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
