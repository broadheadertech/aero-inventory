"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, CheckCircle } from "lucide-react";

export default function SeedPage() {
  const seedData = useMutation(api.mutations.seedData.seedData);
  const seedWarehouse = useMutation(api.mutations.seedWarehouseStock.seedWarehouseStock);
  const seedEvents = useMutation(api.mutations.seedTradingEvents.seedTradingEvents);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingWarehouse, setIsSeedingWarehouse] = useState(false);
  const [isSeedingEvents, setIsSeedingEvents] = useState(false);
  const [eventsResult, setEventsResult] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [warehouseResult, setWarehouseResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSeed = async () => {
    setIsSeeding(true);
    setError("");
    try {
      const res = await seedData({});
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <CardTitle className="mt-4">Seed Demo Data</CardTitle>
          <p className="text-sm text-muted-foreground">
            Populate the system with sample branches, products, inventory, and suppliers for demo purposes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <div className="space-y-3 text-center">
              {result.seeded ? (
                <>
                  <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                  <p className="font-medium text-green-700">Data seeded successfully!</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded border p-2">
                      <p className="text-2xl font-bold">{String(result.branches)}</p>
                      <p className="text-muted-foreground">Branches</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-2xl font-bold">{String(result.products)}</p>
                      <p className="text-muted-foreground">Products</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-2xl font-bold">{String(result.branchProducts)}</p>
                      <p className="text-muted-foreground">Inventory Records</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-2xl font-bold">{String(result.suppliers)}</p>
                      <p className="text-muted-foreground">Suppliers</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = "/dashboard"}>
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isSeedingWarehouse}
                    onClick={async () => {
                      setIsSeedingWarehouse(true);
                      try {
                        const res = await seedWarehouse({});
                        setWarehouseResult(res.seeded ? `${res.productsAdded} products added to warehouse` : res.message ?? "Already seeded");
                      } catch (err) {
                        setWarehouseResult(err instanceof Error ? err.message : "Failed");
                      } finally { setIsSeedingWarehouse(false); }
                    }}
                  >
                    {isSeedingWarehouse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {warehouseResult ?? "Seed Warehouse Stock"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">{String(result.message)}</p>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = "/dashboard"}>
                    Go to Dashboard
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>This will create:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>8 retail branches + 1 warehouse</li>
                  <li>20 products across 6 categories</li>
                  <li>160 inventory records with sell-thru data</li>
                  <li>3 suppliers</li>
                  <li>Sell-thru thresholds</li>
                </ul>
              </div>
              <Button className="w-full" onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Seeding...</>
                ) : (
                  <><Database className="mr-2 h-4 w-4" />Seed Demo Data</>
                )}
              </Button>
            </>
          )}
          {/* Always show warehouse seed button */}
          <div className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              className="w-full"
              disabled={isSeedingWarehouse}
              onClick={async () => {
                setIsSeedingWarehouse(true);
                try {
                  const res = await seedWarehouse({});
                  setWarehouseResult(res.seeded ? `${res.productsAdded} products added to warehouse` : res.message ?? "Done");
                } catch (err) {
                  setWarehouseResult(err instanceof Error ? err.message : "Failed");
                } finally { setIsSeedingWarehouse(false); }
              }}
            >
              {isSeedingWarehouse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              {warehouseResult ?? "Seed Warehouse Stock"}
            </Button>
            {warehouseResult && (
              <p className="text-xs text-center text-muted-foreground mt-2">{warehouseResult}</p>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={isSeedingEvents}
              onClick={async () => {
                setIsSeedingEvents(true);
                try {
                  const res = await seedEvents({});
                  setEventsResult(res.seeded ? `${res.eventsCreated} events created (paydays + holidays)` : "Done");
                } catch (err) {
                  setEventsResult(err instanceof Error ? err.message : "Failed");
                } finally { setIsSeedingEvents(false); }
              }}
            >
              {isSeedingEvents ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              {eventsResult ?? "Seed Trading Calendar (2026)"}
            </Button>
            {eventsResult && (
              <p className="text-xs text-center text-muted-foreground mt-2">{eventsResult}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
