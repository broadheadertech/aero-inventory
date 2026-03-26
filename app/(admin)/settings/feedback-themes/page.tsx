"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

export default function FeedbackThemesPage() {
  const { toast } = useToast();
  const themes = useQuery(api.queries.listFeedbackThemes.listFeedbackThemes, {});
  const seed = useMutation(api.mutations.feedbackThemes.seedDefaultThemes);
  const upsert = useMutation(api.mutations.feedbackThemes.upsertTheme);
  const deleteTheme = useMutation(api.mutations.feedbackThemes.deleteTheme);

  const [newTheme, setNewTheme] = useState("");
  const [newKeywords, setNewKeywords] = useState("");

  const handleSeed = async () => {
    const result = await seed({});
    toast({ title: result.seeded ? `Seeded ${result.count} default themes` : "Themes already exist" });
  };

  const handleAdd = async () => {
    if (!newTheme || !newKeywords) return;
    await upsert({ theme: newTheme, keywords: newKeywords.split(",").map((k) => k.trim()), isActive: true });
    toast({ title: "Theme added" });
    setNewTheme(""); setNewKeywords("");
  };

  const handleToggle = async (theme: string, keywords: string[], isActive: boolean) => {
    await upsert({ theme, keywords, isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback Themes</h1>
          <p className="text-muted-foreground">Configure keyword-based theme extraction for customer feedback</p>
        </div>
        {themes?.length === 0 && <Button onClick={handleSeed}>Seed Defaults</Button>}
      </div>

      {themes === undefined ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Theme</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themes.map((t) => (
                <TableRow key={t._id}>
                  <TableCell className="font-medium">{t.theme}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.keywords.slice(0, 5).map((k) => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
                      {t.keywords.length > 5 && <Badge variant="secondary" className="text-xs">+{t.keywords.length - 5} more</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Switch checked={t.isActive} onCheckedChange={(checked) => handleToggle(t.theme, t.keywords, checked)} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteTheme({ themeId: t._id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input placeholder="Theme name" value={newTheme} onChange={(e) => setNewTheme(e.target.value)} />
            </div>
            <div className="flex-[2]">
              <Input placeholder="Keywords (comma-separated)" value={newKeywords} onChange={(e) => setNewKeywords(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={!newTheme || !newKeywords}><Plus className="mr-2 h-4 w-4" />Add</Button>
          </div>
        </>
      )}
    </div>
  );
}
