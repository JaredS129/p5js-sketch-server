import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import type { SketchMeta } from "../../scripts/lib/meta";

const columnHelper = createColumnHelper<SketchMeta>();

const columns = [
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("type", { header: "Type" }),
  columnHelper.accessor("dateCreated", { header: "Created" }),
  columnHelper.accessor("dateUpdated", { header: "Updated" }),
  columnHelper.accessor("createdBy", { header: "Created by" }),
  columnHelper.accessor("lastUpdatedBy", { header: "Last updated by" }),
];

/** Sortable home table; clicking a row navigates to that sketch (FR-002–FR-005). */
export function SketchTable({ data }: { data: SketchMeta[] }) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dateUpdated", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns: useMemo(() => columns, []),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-edge">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-2 text-left text-muted">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none px-4 py-3 font-medium hover:text-fg"
                >
                  <span>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </span>
                  <span aria-hidden="true">
                    {{ asc: " ↑", desc: " ↓" }[
                      header.column.getIsSorted() as string
                    ] ?? ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/sketch/${row.original.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/sketch/${row.original.id}`);
                }
              }}
              className="cursor-pointer border-t border-edge bg-surface transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-fg">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
