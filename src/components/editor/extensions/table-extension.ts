/**
 * Table extension configuration for insertable/resizable tables
 * Includes table, row, cell, and header cell nodes — all exported from @tiptap/extension-table
 */
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";

export const TableExtensions = [
    Table.configure({
        resizable: true,
        HTMLAttributes: {
            class: "tiptap-table",
        },
    }),
    TableRow,
    TableCell,
    TableHeader,
];
