"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Minus, ArrowUpRight, Search } from "lucide-react";
import type { DecliningProduct } from "@/convex/queries/getDecliningSellThru";

type DecliningProductsTableProps = {
  data: DecliningProduct[] | undefined;
};

const TRAJECTORY_CONFIG = {
  fast: { label: "Fast", color: "bg-green-100 text-green-800", icon: TrendingUp },
  mid: { label: "Mid", color: "bg-amber-100 text-amber-800", icon: ArrowUpRight },
  slow: { label: "Slow", color: "bg-red-100 text-red-800", icon: TrendingDown },
  stable: { label: "Stable", color: "bg-gray-100 text-gray-800", icon: Minus },
};

export function DecliningProductsTable({ data }: DecliningProductsTableProps) {
  const [search, setSearch] = useState("");

  if (data === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border py-8">
        <p className="text-sm text-muted-foreground">
          No products with declining velocity found.
        </p>
      </div>
    );
  }

  const filtered = data.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.styleCode?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by style code or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9"
      />
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Style Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Previous %</TableHead>
          <TableHead className="text-right">Current %</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead>Trajectory</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((product) => {
          const config = TRAJECTORY_CONFIG[product.trajectory];
          const Icon = config.icon;
          return (
            <TableRow key={product.productId}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                      {product.styleCode.slice(-3)}
                    </div>
                  )}
                  {product.styleCode}
                </div>
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.department}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-right">
                {product.previousSellThru.toFixed(2)}%
              </TableCell>
              <TableCell className="text-right">
                {product.currentSellThru.toFixed(2)}%
              </TableCell>
              <TableCell className="text-right font-medium text-red-600">
                {product.delta.toFixed(2)}%
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={config.color}>
                  <Icon className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
}
