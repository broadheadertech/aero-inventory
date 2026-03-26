"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoyaltySettingsPage() {
  const { toast } = useToast();
  const config = useQuery(api.queries.loyaltyQueries.getLoyaltyConfig, {});
  const configure = useMutation(api.mutations.loyaltySync.configureLoyalty);
  const [saving, setSaving] = useState(false);

  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [frequency, setFrequency] = useState("4");
  const [enabled, setEnabled] = useState(false);

  // M3 fix: use useEffect for state sync instead of render-body setState
  useEffect(() => {
    if (config) {
      setEndpoint(config.apiEndpoint);
      setApiKey(config.apiKey);
      setFrequency(String(config.syncFrequencyHours));
      setEnabled(config.isEnabled);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await configure({ apiEndpoint: endpoint, apiKey, syncFrequencyHours: Number(frequency), isEnabled: enabled });
      toast({ title: "Loyalty config saved" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (config === undefined) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loyalty API Settings</h1>
        <p className="text-muted-foreground">Configure connection to your loyalty platform</p>
      </div>
      <Card>
        <CardHeader><CardTitle>API Connection</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>API Endpoint</Label><Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://loyalty-api.example.com/v1" /></div>
          <div><Label>API Key</Label><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key" /></div>
          <div><Label>Sync Frequency (hours)</Label><Input type="number" min={1} value={frequency} onChange={(e) => setFrequency(e.target.value)} /></div>
          <div className="flex items-center gap-2"><Switch checked={enabled} onCheckedChange={setEnabled} /><Label>{enabled ? "Enabled" : "Disabled"}</Label></div>
          {config?.lastSyncAt && <p className="text-sm text-muted-foreground">Last sync: {new Date(config.lastSyncAt).toLocaleString()}</p>}
          <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}
