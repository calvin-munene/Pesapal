import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  getAccessToken,
  registerIPN,
  submitOrder,
  getTransactionStatus,
} from "./pesapal";
import { log } from "./index";

let cachedIpnId: string | null = null;

function getBaseUrl(req: Request): string {
  const host = req.get("host") || "localhost:5000";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${protocol}://${host}`;
}

async function ensureIpnRegistered(req: Request): Promise<string> {
  if (cachedIpnId) return cachedIpnId;
  const callbackUrl = `${getBaseUrl(req)}/api/pesapal/ipn`;
  cachedIpnId = await registerIPN(callbackUrl);
  return cachedIpnId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Health Check ────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ─── Pesapal: validate credentials ───────────────────────────────────────
  app.get("/api/pesapal/test-credentials", async (_req, res) => {
    try {
      await getAccessToken();
      res.json({ success: true, message: "Credentials are valid." });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ─── Pesapal: initiate payment ────────────────────────────────────────────
  app.post("/api/pesapal/initiate", async (req: Request, res: Response) => {
    try {
      const bodySchema = z.object({
        amount: z.number().positive(),
        currency: z.string().default("KES"),
        description: z.string().optional(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      });

      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten() });
      }

      const { amount, currency, description, firstName, lastName, email, phone } = parsed.data;

      const merchantReference = `PAY-${randomUUID().slice(0, 8).toUpperCase()}`;
      const ipnId = await ensureIpnRegistered(req);
      const callbackUrl = `${getBaseUrl(req)}/payment/callback`;

      const { redirectUrl, orderTrackingId } = await submitOrder({
        merchantReference,
        amount,
        currency,
        description: description || `Payment of ${currency} ${amount}`,
        firstName,
        lastName,
        email,
        phone,
        callbackUrl,
        ipnId,
      });

      const tx = await storage.createTransaction({
        merchantReference,
        amount,
        currency,
        description: description || `Payment of ${currency} ${amount}`,
        firstName,
        lastName,
        email,
        phone,
      });

      await storage.updateTransaction(tx.id, {
        orderTrackingId,
        pesapalPaymentUrl: redirectUrl,
      });

      res.json({
        success: true,
        redirectUrl,
        orderTrackingId,
        merchantReference,
        transactionId: tx.id,
      });
    } catch (err: any) {
      log(`Initiate payment error: ${err.message}`, "routes");
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ─── Pesapal: IPN callback ────────────────────────────────────────────────
  app.get("/api/pesapal/ipn", async (req: Request, res: Response) => {
    try {
      const { orderTrackingId, orderMerchantReference } = req.query as Record<string, string>;
      log(`IPN received: trackingId=${orderTrackingId} ref=${orderMerchantReference}`, "pesapal");

      if (orderTrackingId) {
        const statusData = await getTransactionStatus(orderTrackingId);
        const status = statusData.paymentStatusDescription.toUpperCase() as any;

        const tx = await storage.getTransactionByTrackingId(orderTrackingId);
        if (tx) {
          await storage.updateTransaction(tx.id, {
            status,
            paymentMethod: statusData.paymentMethod,
            confirmedAt: status === "COMPLETED" ? new Date() : undefined,
          });
        }
      }

      res.json({ orderNotificationType: "IPNCHANGE", orderTrackingId, orderMerchantReference });
    } catch (err: any) {
      log(`IPN error: ${err.message}`, "routes");
      res.status(200).json({ error: err.message });
    }
  });

  // ─── Pesapal: poll payment status ─────────────────────────────────────────
  app.get("/api/pesapal/status/:orderTrackingId", async (req: Request, res: Response) => {
    try {
      const { orderTrackingId } = req.params;
      const statusData = await getTransactionStatus(orderTrackingId);

      const tx = await storage.getTransactionByTrackingId(orderTrackingId);
      if (tx) {
        const status = statusData.paymentStatusDescription.toUpperCase() as any;
        await storage.updateTransaction(tx.id, {
          status,
          paymentMethod: statusData.paymentMethod,
          confirmedAt: status === "COMPLETED" ? new Date() : undefined,
        });
      }

      res.json({ success: true, ...statusData, transaction: tx });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ─── Transactions: list ───────────────────────────────────────────────────
  app.get("/api/transactions", async (_req, res) => {
    try {
      const txs = await storage.listTransactions();
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Transactions: single ─────────────────────────────────────────────────
  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const tx = await storage.getTransaction(req.params.id);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      res.json(tx);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
