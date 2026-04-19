import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const txStatusEnum = pgEnum("tx_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "INVALID",
  "REVERSED",
]);

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantReference: varchar("merchant_reference").notNull().unique(),
  orderTrackingId: varchar("order_tracking_id"),
  amount: integer("amount").notNull(),
  currency: varchar("currency").notNull().default("KES"),
  description: text("description"),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  status: txStatusEnum("status").notNull().default("PENDING"),
  paymentMethod: varchar("payment_method"),
  pesapalPaymentUrl: text("pesapal_payment_url"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmedAt: true,
  orderTrackingId: true,
  status: true,
  pesapalPaymentUrl: true,
  paymentMethod: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
