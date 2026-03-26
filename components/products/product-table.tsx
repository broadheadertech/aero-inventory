"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

function formatPHP(centavos: number): string {
  return (
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      currencyDisplay: "symbol",
    })
      .format(centavos / 100)
      .replace("PHP", "₱")
  );
}

interface ProductTableProps {
  products: Doc<"products">[];
}

export function ProductTable({ products }: ProductTableProps) {
  const [search, setSearch] = useState("");

  const filtered = products.filter((item) => {
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
          <TableHead>Description</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">SRP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((product) => (
          <TableRow
            key={product._id}
            className={!product.isActive ? "opacity-50" : undefined}
          >
            <TableCell>
              <div className="flex items-center gap-2">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                    {product.styleCode.slice(-3)}
                  </div>
                )}
                <Link
                  href={`/products/${product._id}`}
                  className="font-mono text-sm font-medium hover:underline"
                >
                  {product.styleCode}
                </Link>
              </div>
            </TableCell>
            <TableCell>{product.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {product.department}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {product.category}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPHP(product.retailPrice)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
