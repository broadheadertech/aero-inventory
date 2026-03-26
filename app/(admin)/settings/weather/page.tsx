"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherLocationForm } from "@/components/weather/weather-location-form";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function WeatherSettingsPage() {
  const { toast } = useToast();
  const locations = useQuery(api.queries.listWeatherLocations.listWeatherLocations, {});
  const deleteLocation = useMutation(api.mutations.weatherLocations.deleteWeatherLocation);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"weatherLocations"> | null>(null);

  const handleEdit = (loc: Doc<"weatherLocations">) => { setEditing(loc); setFormOpen(true); };
  const handleCreate = () => { setEditing(null); setFormOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weather Locations</h1>
          <p className="text-muted-foreground">Configure weather data sources mapped to branch regions</p>
        </div>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Add Location</Button>
      </div>

      {locations === undefined ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : locations.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No weather locations configured.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead className="text-right">Branches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc._id}>
                <TableCell className="font-medium">{loc.name}</TableCell>
                <TableCell>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</TableCell>
                <TableCell className="text-right">{loc.branchIds.length}</TableCell>
                <TableCell><Badge variant="secondary" className={loc.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{loc.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(loc)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={async () => { await deleteLocation({ locationId: loc._id }); toast({ title: "Deleted" }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <WeatherLocationForm open={formOpen} onOpenChange={setFormOpen} editingLocation={editing} />
    </div>
  );
}
