import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const csvImports = pgTable("csv_imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  filename: text("filename").notNull(),
  rowCount: integer("row_count").notNull(),
});

export const csvRows = pgTable("csv_rows", {
  id: uuid("id").defaultRandom().primaryKey(),
  importId: uuid("import_id")
    .notNull()
    .references(() => csvImports.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  date: text("date"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  taxCode: text("tax_code"),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2, mode: "number" }),
  amountKind: text("amount_kind").notNull(),
  abn: text("abn"),
});

export const findings = pgTable("findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  importId: uuid("import_id")
    .notNull()
    .references(() => csvImports.id, { onDelete: "cascade" }),
  rowId: uuid("row_id").references(() => csvRows.id, { onDelete: "set null" }),
  code: text("code").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
});
