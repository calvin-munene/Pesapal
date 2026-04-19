import { log } from "./index";

const PESAPAL_BASE_URL = process.env.PESAPAL_ENV === "production"
  ? "https://pay.pesapal.com/v3"
  : "https://cybqa.pesapal.com/pesapalv3";

export interface PesapalToken {
  token: string;
  expiryDate: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET must be set");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pesapal auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Pesapal auth error: ${JSON.stringify(data.error)}`);
  }

  const expiresAt = new Date(data.expiryDate).getTime();
  cachedToken = { token: data.token, expiresAt };
  log(`Pesapal access token acquired, expires ${data.expiryDate}`, "pesapal");
  return data.token;
}

export async function registerIPN(callbackUrl: string): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: callbackUrl,
      ipn_notification_type: "GET",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pesapal IPN registration failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Pesapal IPN error: ${JSON.stringify(data.error)}`);
  }

  log(`IPN registered: ${data.ipn_id}`, "pesapal");
  return data.ipn_id;
}

export interface SubmitOrderParams {
  merchantReference: string;
  amount: number;
  currency: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  callbackUrl: string;
  ipnId: string;
}

export async function submitOrder(params: SubmitOrderParams): Promise<{ redirectUrl: string; orderTrackingId: string }> {
  const token = await getAccessToken();

  const body = {
    id: params.merchantReference,
    currency: params.currency,
    amount: params.amount,
    description: params.description || "Payment",
    callback_url: params.callbackUrl,
    notification_id: params.ipnId,
    billing_address: {
      email_address: params.email,
      phone_number: params.phone || "",
      country_code: "KE",
      first_name: params.firstName,
      last_name: params.lastName,
    },
  };

  const res = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pesapal submit order failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Pesapal submit order error: ${JSON.stringify(data.error)}`);
  }

  return {
    redirectUrl: data.redirect_url,
    orderTrackingId: data.order_tracking_id,
  };
}

export async function getTransactionStatus(orderTrackingId: string): Promise<{
  paymentStatusDescription: string;
  paymentMethod: string;
  amount: number;
  createdDate: string;
  confirmedDate?: string;
  currency: string;
}> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pesapal status check failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Pesapal status error: ${JSON.stringify(data.error)}`);
  }

  return {
    paymentStatusDescription: data.payment_status_description,
    paymentMethod: data.payment_method,
    amount: data.amount,
    createdDate: data.created_date,
    confirmedDate: data.confirmation_code ? data.created_date : undefined,
    currency: data.currency,
  };
}
