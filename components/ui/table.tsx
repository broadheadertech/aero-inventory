"use client"

import * as React from "react"
import { useState, useMemo } from "react"

import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, paginate = true, pageSize = PAGE_SIZE, children, ...props }: React.ComponentProps<"tbody"> & { paginate?: boolean; pageSize?: number }) {
  const childArray = React.Children.toArray(children)
  const totalItems = childArray.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const needsPagination = paginate && totalItems > pageSize

  const [page, setPage] = useState(0)

  // Reset page if data shrinks
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))

  const visibleChildren = useMemo(() => {
    if (!needsPagination) return childArray
    const start = currentPage * pageSize
    return childArray.slice(start, start + pageSize)
  }, [needsPagination, childArray, currentPage, pageSize])

  return (
    <>
      <tbody
        data-slot="table-body"
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
      >
        {visibleChildren}
      </tbody>
      {needsPagination && (
        <tfoot>
          <tr>
            <td colSpan={100} className="p-0">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </td>
          </tr>
        </tfoot>
      )}
    </>
  )
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-t px-3 py-2">
      <span className="text-xs text-muted-foreground">
        {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          let pageNum: number
          if (totalPages <= 5) pageNum = i
          else if (currentPage < 3) pageNum = i
          else if (currentPage > totalPages - 4) pageNum = totalPages - 5 + i
          else pageNum = currentPage - 2 + i
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium",
                pageNum === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {pageNum + 1}
            </button>
          )
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
