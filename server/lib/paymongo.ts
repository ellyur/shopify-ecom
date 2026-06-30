/**
 * PayMongo Integration
 * ============================================================
 * Required Environment Variables (set per client deployment):
 *   PAYMONGO_SECRET_KEY   — Secret key from PayMongo dashboard (sk_live_... or sk_test_...)
 *   PAYMONGO_PUBLIC_KEY   — Publishable key (pk_live_... or pk_test_...)
 *   PAYMONGO_WEBHOOK_SECRET — Webhook secret from PayMongo Dashboard → Webhooks
 *
 * Webhook Setup (do this in each client's PayMongo dashboard):
 *   1. Go to Developers → Webhooks → Add Endpoint
 *   2. URL: https://<your-domain>/api/paymongo/webhook
 *   3. Events: checkout_session.payment.paid
 *   4. Copy the "Webhook Secret Key" → set as PAYMONGO_WEBHOOK_SECRET
 * ============================================================
 */

import crypto from "crypto";

const BASE_URL = "https://api.paymongo.com/v1";

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY environment variable is not set.");
  return key;
}

function getAuthHeader(): string {
  return "Basic " + Buffer.from(getSecretKey() + ":").toString("base64");
}

export function isPayMongoConfigured(): boolean {
  return !!(process.env.PAYMONGO_SECRET_KEY && process.env.PAYMONGO_PUBLIC_KEY);
}

export function getPublicKey(): string | null {
  return process.env.PAYMONGO_PUBLIC_KEY || null;
}

export interface PayMongoLineItem {
  name: string;
  quantity: number;
  amountPHP: number; // in Philippine Pesos (NOT centavos) — we convert internally
}

export interface CreateCheckoutParams {
  orderNumber: string;
  lineItems: PayMongoLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  customerName?: string | null;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  paymentIntentId?: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
  const body = {
    data: {
      attributes: {
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        cancel_url: params.cancelUrl,
        success_url: params.successUrl,
        description: `Order ${params.orderNumber}`,
        line_items: params.lineItems.map((item) => ({
          currency: "PHP",
          amount: Math.round(item.amountPHP * 100), // convert to centavos
          description: item.name,
          name: item.name,
          quantity: item.quantity,
        })),
        payment_method_types: ["gcash", "paymaya", "card", "dob", "dob_ubp", "billease"],
        metadata: {
          order_number: params.orderNumber,
        },
        ...(params.customerEmail || params.customerName
          ? {
              customer_info: {
                ...(params.customerName ? { name: params.customerName } : {}),
                ...(params.customerEmail ? { email: params.customerEmail } : {}),
              },
            }
          : {}),
      },
    },
  };

  const response = await fetch(`${BASE_URL}/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = "Failed to create payment session";
    try {
      const err = await response.json();
      errorMessage = err.errors?.[0]?.detail || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const attrs = data.data.attributes;

  return {
    sessionId: data.data.id,
    checkoutUrl: attrs.checkout_url,
    paymentIntentId: attrs.payment_intent?.id,
  };
}

export async function getCheckoutSession(sessionId: string): Promise<{
  sessionId: string;
  status: string;
  paymentStatus: string | null;
  orderNumber: string | null;
}> {
  const response = await fetch(`${BASE_URL}/checkout_sessions/${sessionId}`, {
    headers: { Authorization: getAuthHeader() },
  });

  if (!response.ok) {
    let errorMessage = "Failed to retrieve payment session";
    try {
      const err = await response.json();
      errorMessage = err.errors?.[0]?.detail || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const attrs = data.data.attributes;

  return {
    sessionId: data.data.id,
    status: attrs.status, // 'active' | 'expired'
    paymentStatus: attrs.payment_intent?.attributes?.status ?? null,
    orderNumber: attrs.metadata?.order_number ?? null,
  };
}

/**
 * Verify that the incoming webhook request is genuinely from PayMongo.
 * Returns true if verification passes or if PAYMONGO_WEBHOOK_SECRET is not set.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[paymongo] PAYMONGO_WEBHOOK_SECRET not set — skipping signature verification.");
    return true;
  }

  if (!signatureHeader) return false;

  // Header format: t=<timestamp>,li=<test_sig>,lv=<live_sig>
  const parts = signatureHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const liveSig = parts.find((p) => p.startsWith("lv="))?.slice(3);
  const testSig = parts.find((p) => p.startsWith("li="))?.slice(3);
  const sig = liveSig || testSig;

  if (!timestamp || !sig) return false;

  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
}
