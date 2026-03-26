"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "@/convex/_generated/dataModel";

interface BranchTableProps {
  branches: Doc<"branches">[];
}

export function BranchTable({ branches }: BranchTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {branches.map((branch) => (
          <TableRow key={branch._id}>
            <TableCell>
              <Link
                href={`/branches/${branch._id}`}
                className="font-medium hover:underline"
              >
                {branch.name}
              </Link>
            </TableCell>
            <TableCell className="font-mono text-sm">{branch.code}</TableCell>
            <TableCell className="text-muted-foreground">
              {branch.address}
            </TableCell>
            <TableCell>
              <Badge variant={branch.isActive ? "default" : "secondary"}>
                {branch.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
