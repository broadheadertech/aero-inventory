"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

function formatCurrency(centavos: number) {
  return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export default function MarkdownProposalsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("pending");
  const pending = useQuery(api.queries.listMarkdownProposals.listMarkdownProposals, { status: "pending" });
  const history = useQuery(api.queries.listMarkdownProposals.listMarkdownProposals, {});

  const approve = useMutation(api.mutations.resolveMarkdownProposal.approveProposal);
  const reject = useMutation(api.mutations.resolveMarkdownProposal.rejectProposal);

  const [rejectTarget, setRejectTarget] = useState<Id<"markdownProposals"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (id: Id<"markdownProposals">) => {
    try {
      await approve({ proposalId: id });
      toast({ title: "Markdown approved — prices updated" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await reject({ proposalId: rejectTarget, reason: rejectReason || "No reason given" });
      toast({ title: "Proposal rejected" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally { setRejectTarget(null); setRejectReason(""); }
  };

  const statusBadge = (status: string) => {
    const cls = status === "approved" ? "bg-green-100 text-green-800" : status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
    return <Badge variant="secondary" className={cls}>{status}</Badge>;
  };

  const renderTable = (proposals: typeof pending, showActions: boolean) => {
    if (proposals === undefined) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    if (proposals.length === 0) return <p className="text-center text-muted-foreground py-12">No proposals.</p>;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Proposed</TableHead>
            <TableHead className="text-right">Markdown</TableHead>
            <TableHead className="text-right">Current Margin</TableHead>
            <TableHead className="text-right">Post Margin</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((p) => (
            <TableRow key={p._id}>
              <TableCell className="font-medium">{p.productName}<br /><span className="text-xs text-muted-foreground">{p.productSku}</span></TableCell>
              <TableCell>{p.ruleName}</TableCell>
              <TableCell className="text-right">{formatCurrency(p.currentPriceCentavos)}</TableCell>
              <TableCell className="text-right">{formatCurrency(p.proposedPriceCentavos)}</TableCell>
              <TableCell className="text-right">{p.markdownPercent}%</TableCell>
              <TableCell className="text-right">{p.currentMarginPercent.toFixed(1)}%</TableCell>
              <TableCell className="text-right font-medium" style={{ color: p.postMarkdownMarginPercent < 10 ? "#dc2626" : undefined }}>{p.postMarkdownMarginPercent.toFixed(1)}%</TableCell>
              <TableCell>{statusBadge(p.status)}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleApprove(p._id)} title="Approve"><Check className="h-4 w-4 text-green-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setRejectTarget(p._id)} title="Reject"><X className="h-4 w-4 text-red-600" /></Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Markdown Proposals</h1>
        <p className="text-muted-foreground">Review and approve automated markdown recommendations</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">{renderTable(pending, true)}</TabsContent>
        <TabsContent value="history">{renderTable(history?.filter((p) => p.status !== "pending"), false)}</TabsContent>
      </Tabs>

      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Proposal</AlertDialogTitle>
            <AlertDialogDescription>Please provide a reason for rejection.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
