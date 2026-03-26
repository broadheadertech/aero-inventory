"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PosConfigForm } from "@/components/pos/pos-config-form";
import { Plus } from "lucide-react";

export default function PosSettingsPage() {
  const { toast } = useToast();
  const configs = useQuery(api.queries.listPosConfigs.listPosConfigs, {});
  const updateConfig = useMutation(api.mutations.posConfig.updatePosConfig);
  const [formOpen, setFormOpen] = useState(false);

  const handleToggle = async (configId: string, isEnabled: boolean) => {
    try {
      await updateConfig({ configId: configId as any, isEnabled });
      toast({ title: isEnabled ? "POS enabled" : "POS disabled" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">POS Configuration</h1>
          <p className="text-muted-foreground">Configure POS integration per branch</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Branch POS</Button>
      </div>

      {configs === undefined ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : configs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No POS configurations yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Synced</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead>Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((c) => (
              <TableRow key={c._id}>
                <TableCell className="font-medium">{c.branchName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={c.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {c.isEnabled ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{c.syncSuccessCount}</TableCell>
                <TableCell className="text-right">{c.syncErrorCount}</TableCell>
                <TableCell>{c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : "Never"}</TableCell>
                <TableCell>
                  <Switch checked={c.isEnabled} onCheckedChange={(checked) => handleToggle(c._id, checked)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <PosConfigForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
