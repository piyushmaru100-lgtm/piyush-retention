import { PRODUCTS } from '../src/data/products.ts';

// ---------- Types (minimal, so no extra packages are needed) ----------
interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface Env {
  DB: { prepare(query: string): D1Stmt };
  ASSETS: { fetch(request: Request): Promise<Response> };
  FILES?: { get(key: string): Promise<{ body: ReadableStream } | null> }; // optional private R2 bucket
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
}

interface Item {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

interface OrderRow {
  order_id: string;
  customer_email: string;
  customer_name: string | null;
  items_json: string;
  amount: number;
  status: string;
  payment_id: string | null;
  download_token: string | null;
  created_at: number;
  paid_at: number | null;
}

const DOWNLOAD_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// ---------- Helpers ----------
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return 'dl_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const isConfigured = (env: Env) =>
  Boolean(
    env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      (env.RAZORPAY_KEY_ID.startsWith('rzp_test_') || env.RAZORPAY_KEY_ID.startsWith('rzp_live_'))
  );

async function getOrder(env: Env, orderId: string) {
  return env.DB.prepare('SELECT * FROM orders WHERE order_id = ?').bind(orderId).first<OrderRow>();
}

// Marks an order paid exactly once (safe if webhook and verify-payment both arrive)
async function markPaid(env: Env, orderId: string, paymentId: string): Promise<OrderRow | null> {
  await env.DB.prepare(
    "UPDATE orders SET status = 'paid', payment_id = ?, download_token = ?, paid_at = ? WHERE order_id = ? AND status <> 'paid'"
  )
    .bind(paymentId, randomToken(), Date.now(), orderId)
    .run();
  return getOrder(env, orderId);
}

function buildDownloads(order: OrderRow) {
  const items: Item[] = JSON.parse(order.items_json);
  const purchasedProducts = PRODUCTS.filter((p) => items.some((i) => i.productId === p.id));
  const downloads = purchasedProducts.flatMap((p) =>
    p.downloadFiles.map((df) => ({
      ...df,
      productId: p.id,
      productName: p.name,
      downloadUrl: `/api/download/${order.download_token}/${p.id}/${df.id}`,
    }))
  );
  return { items, purchasedProducts, downloads };
}

// ---------- Handlers ----------
function handlePaymentConfig(env: Env) {
  const configured = isConfigured(env);
  return json({
    isConfigured: configured,
    keyId: configured ? env.RAZORPAY_KEY_ID : null,
    isDemoMode: !configured,
    currency: 'INR',
    message: configured ? 'Razorpay Gateway Active' : 'Razorpay is not configured yet',
  });
}

async function handleCreateOrder(request: Request, env: Env) {
  if (!isConfigured(env)) return json({ error: 'Payments are not configured' }, 503);

  const body = (await request.json().catch(() => null)) as any;
  const items = body?.items;
  const customerEmail = body?.customerEmail;
  const customerName = body?.customerName;

  if (!Array.isArray(items) || items.length === 0) return json({ error: 'Cart items are required' }, 400);
  if (items.length > 50) return json({ error: 'Too many items' }, 400);
  if (typeof customerEmail !== 'string' || !customerEmail.includes('@') || customerEmail.length > 200) {
    return json({ error: 'Valid customer email is required' }, 400);
  }

  // Price is ALWAYS calculated on the server from the product catalog
  let totalAmount = 0;
  const validatedItems: Item[] = [];
  for (const item of items) {
    const product = PRODUCTS.find((p) => p.id === item?.productId);
    if (!product) return json({ error: `Product not found: ${item?.productId}` }, 400);
    const qty = Math.min(10, Math.max(1, parseInt(item.quantity, 10) || 1));
    totalAmount += product.price * qty;
    validatedItems.push({ productId: product.id, quantity: qty, price: product.price, name: product.name });
  }

  const auth = 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { customerEmail, customerName: customerName || '' },
    }),
  });

  if (!rzpRes.ok) {
    console.error('Razorpay order error:', await rzpRes.text());
    return json({ error: 'Failed to create order with Razorpay' }, 502);
  }

  const order = (await rzpRes.json()) as { id: string };

  await env.DB.prepare(
    "INSERT INTO orders (order_id, customer_email, customer_name, items_json, amount, status, created_at) VALUES (?, ?, ?, ?, ?, 'created', ?)"
  )
    .bind(order.id, customerEmail, customerName || '', JSON.stringify(validatedItems), totalAmount, Date.now())
    .run();

  return json({
    orderId: order.id,
    amount: totalAmount,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    isDemoMode: false,
    customerEmail,
    customerName,
  });
}

async function handleVerifyPayment(request: Request, env: Env) {
  if (!isConfigured(env)) return json({ error: 'Payments are not configured' }, 503);

  const body = (await request.json().catch(() => null)) as any;
  const orderId = body?.orderId;
  const paymentId = body?.paymentId;
  const signature = body?.signature;

  if (!orderId || !paymentId || !signature) {
    return json({ error: 'orderId, paymentId and signature are required' }, 400);
  }

  const existing = await getOrder(env, String(orderId));
  if (!existing) return json({ error: 'Order not found' }, 404);

  const expected = await hmacHex(env.RAZORPAY_KEY_SECRET!, `${orderId}|${paymentId}`);
  if (!safeEqual(expected, String(signature))) {
    return json({ error: 'Invalid payment signature. Verification failed.' }, 400);
  }

  const order = await markPaid(env, String(orderId), String(paymentId));
  if (!order || !order.download_token) return json({ error: 'Could not finalize order' }, 500);

  const { items, purchasedProducts, downloads } = buildDownloads(order);

  return json({
    success: true,
    orderId: order.order_id,
    paymentId: order.payment_id,
    downloadToken: order.download_token,
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    purchasedItems: items,
    totalAmount: order.amount,
    purchasedProducts,
    downloads,
    verifiedAt: new Date().toISOString(),
  });
}

async function handleWebhook(request: Request, env: Env) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return json({ error: 'Webhook not configured' }, 503);

  const rawBody = await request.text(); // must be the raw body for signature check
  const signature = request.headers.get('x-razorpay-signature') || '';
  const expected = await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, rawBody);
  if (!safeEqual(expected, signature)) return json({ error: 'Invalid signature' }, 400);

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Bad payload' }, 400);
  }

  const payment = event?.payload?.payment?.entity;
  const orderId: string | undefined = payment?.order_id ?? event?.payload?.order?.entity?.id;
  const paymentId: string | undefined = payment?.id;

  if (orderId && paymentId) {
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      await markPaid(env, orderId, paymentId);
    } else if (event.event === 'payment.failed') {
      await env.DB.prepare("UPDATE orders SET status = 'failed' WHERE order_id = ? AND status = 'created'")
        .bind(orderId)
        .run();
    }
  }

  return json({ received: true }); // always 200 for valid signatures so Razorpay does not retry
}

async function handleDownload(env: Env, token: string, productId: string, fileId: string) {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE download_token = ? AND status = 'paid'")
    .bind(token)
    .first<OrderRow>();
  if (!order) return json({ error: 'Invalid or expired download authorization token.' }, 403);

  if (Date.now() - (order.paid_at ?? 0) > DOWNLOAD_MAX_AGE_MS) {
    return json({ error: 'Download token has expired. Please contact support.' }, 403);
  }

  const items: Item[] = JSON.parse(order.items_json);
  if (!items.some((i) => i.productId === productId)) {
    return json({ error: 'Unauthorized asset access. Product not in order.' }, 403);
  }

  const product = PRODUCTS.find((p) => p.id === productId);
  const file = product?.downloadFiles.find((f) => f.id === fileId);
  if (!product || !file) return json({ error: 'Requested download file not found in catalog.' }, 404);

  // If a private R2 bucket is bound and the real file exists, serve it
  if (env.FILES) {
    const obj = await env.FILES.get(`${product.id}/${file.filename}`);
    if (obj) {
      return new Response(obj.body, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file.filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  // Fallback: the same quick-start manifest your old server.ts generated
  const content = `=====================================================
PIYUSHRETENTION — DIGITAL ASSET LICENSED DELIVERY
=====================================================

Product: ${product.name} (${product.categoryLabel})
File: ${file.name} (${file.size})
Format: ${product.fileFormat}
Order ID: ${order.order_id}
License Holder: ${order.customer_email}
Verified Date: ${new Date(order.paid_at ?? order.created_at).toISOString()}

WHAT'S INCLUDED:
${product.whatsIncluded.map((w, i) => `[${i + 1}] ${w}`).join('\n')}

SOFTWARE COMPATIBILITY:
${product.softwareCompatibility.join(', ')}

STEP-BY-STEP INSTALLATION INSTRUCTIONS:
${product.installationInstructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

COMMERCIAL LICENSE TERMS:
- Authorized for unlimited personal, commercial, and client video projects.
- Reselling, redistributing, or sublicensing the raw source files is strictly prohibited.
- For VIP editor assistance or asset updates: piyushretention@gmail.com
- Portfolio Reference: https://piyushretention.framer.website/

=====================================================
Thank you for supporting PIYUSHRETENTION! Keep creating high-retention edits.
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file.filename.replace(/\.zip$/i, '_QuickStart_Manifest.txt')}"`,
      'Cache-Control': 'no-store',
    },
  });
}

// ---------- Router ----------
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    try {
      if (pathname === '/api/payment-config' && request.method === 'GET') return handlePaymentConfig(env);
      if (pathname === '/api/create-order' && request.method === 'POST') return await handleCreateOrder(request, env);
      if (pathname === '/api/verify-payment' && request.method === 'POST') return await handleVerifyPayment(request, env);
      if (pathname === '/api/razorpay-webhook' && request.method === 'POST') return await handleWebhook(request, env);

      const dl = pathname.match(/^\/api\/download\/([^/]+)\/([^/]+)\/([^/]+)$/);
      if (dl && request.method === 'GET') {
        return await handleDownload(env, decodeURIComponent(dl[1]), decodeURIComponent(dl[2]), decodeURIComponent(dl[3]));
      }

      if (pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);

      // Everything else = your website (static files)
      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error('Unhandled error:', err);
      return json({ error: 'Internal server error' }, 500);
    }
  },
};
