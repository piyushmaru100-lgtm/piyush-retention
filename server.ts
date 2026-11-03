import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PRODUCTS } from './src/data/products.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory verified orders registry for token-protected downloads
interface OrderRecord {
  orderId: string;
  paymentId: string;
  customerEmail: string;
  customerName?: string;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  totalAmount: number;
  downloadToken: string;
  createdAt: number;
  isDemo: boolean;
}

const ordersRegistry = new Map<string, OrderRecord>();
const tokenRegistry = new Map<string, OrderRecord>();

// Helper to determine if real Razorpay credentials are set
function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const isReal = Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('YOUR_KEY_ID') &&
    !keySecret.includes('YOUR_RAZORPAY_SECRET') &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
  );
  return {
    isConfigured: isReal,
    keyId: isReal ? keyId : null,
    isDemoMode: !isReal,
    displayKeyId: keyId || null,
  };
}

// 1. GET /api/payment-config - check Razorpay status
app.get('/api/payment-config', (_req, res) => {
  const config = getRazorpayConfig();
  res.json({
    isConfigured: config.isConfigured,
    keyId: config.keyId,
    isDemoMode: config.isDemoMode,
    currency: 'INR',
    message: config.isConfigured
      ? 'Razorpay Live / Test Gateway Active'
      : 'Razorpay Sandbox Demo Mode (Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env for production)',
  });
});

// 2. POST /api/create-order - Authoritative server-side price calculation
app.post('/api/create-order', async (req, res) => {
  try {
    const { items, customerEmail, customerName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid customer email is required' });
    }

    // CRITICAL SECURITY: Calculate order amount strictly on the backend using authoritative product data
    let totalAmount = 0;
    const validatedItems: Array<{ productId: string; quantity: number; price: number; name: string }> = [];

    for (const item of items) {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      totalAmount += product.price * qty;
      validatedItems.push({
        productId: product.id,
        quantity: qty,
        price: product.price,
        name: product.name,
      });
    }

    const config = getRazorpayConfig();

    if (config.isConfigured && config.keyId) {
      // Real Razorpay API Order Creation
      const keyId = process.env.RAZORPAY_KEY_ID!;
      const keySecret = process.env.RAZORPAY_KEY_SECRET!;
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: totalAmount * 100, // in paise
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            customerEmail,
            customerName: customerName || '',
            itemCount: validatedItems.length.toString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Razorpay API Error:', errorData);
        return res.status(502).json({ error: 'Failed to create order with Razorpay', details: errorData });
      }

      const orderData = (await response.json()) as { id: string; amount: number; currency: string };
      return res.json({
        orderId: orderData.id,
        amount: totalAmount,
        currency: 'INR',
        keyId: config.keyId,
        isDemoMode: false,
        customerEmail,
        customerName,
      });
    }

    // Demo Mode: Generate verified simulated order ID
    const demoOrderId = `order_demo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    res.json({
      orderId: demoOrderId,
      amount: totalAmount,
      currency: 'INR',
      keyId: 'rzp_test_DEMO_GATEWAY',
      isDemoMode: true,
      customerEmail,
      customerName,
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Internal server error during order creation', message: err?.message });
  }
});

// 3. POST /api/verify-payment - Verify signature on server & issue download token
app.post('/api/verify-payment', (req, res) => {
  try {
    const { orderId, paymentId, signature, customerEmail, customerName, items } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ error: 'orderId and paymentId are required' });
    }

    const config = getRazorpayConfig();

    if (config.isConfigured && !orderId.startsWith('order_demo_')) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET!;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(signature || '', 'utf-8')
      );

      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
      }
    }

    // Calculate verified items & total
    let totalAmount = 0;
    const validatedItems: Array<{ productId: string; quantity: number; price: number; name: string }> = [];

    if (Array.isArray(items)) {
      for (const item of items) {
        const prod = PRODUCTS.find((p) => p.id === item.productId);
        if (prod) {
          const qty = item.quantity || 1;
          totalAmount += prod.price * qty;
          validatedItems.push({
            productId: prod.id,
            quantity: qty,
            price: prod.price,
            name: prod.name,
          });
        }
      }
    }

    // Generate secure download access token
    const downloadToken = `dl_${crypto.randomBytes(24).toString('hex')}`;
    const orderRecord: OrderRecord = {
      orderId,
      paymentId,
      customerEmail: customerEmail || 'customer@example.com',
      customerName: customerName || '',
      items: validatedItems,
      totalAmount,
      downloadToken,
      createdAt: Date.now(),
      isDemo: orderId.startsWith('order_demo_'),
    };

    ordersRegistry.set(orderId, orderRecord);
    tokenRegistry.set(downloadToken, orderRecord);

    // Collect available download packages
    const purchasedProducts = PRODUCTS.filter((p) =>
      validatedItems.some((vi) => vi.productId === p.id)
    );

    const downloads = purchasedProducts.flatMap((p) =>
      p.downloadFiles.map((df) => ({
        ...df,
        productId: p.id,
        productName: p.name,
        downloadUrl: `/api/download/${downloadToken}/${p.id}/${df.id}`,
      }))
    );

    res.json({
      success: true,
      orderId,
      paymentId,
      downloadToken,
      customerEmail: orderRecord.customerEmail,
      customerName: orderRecord.customerName,
      purchasedItems: validatedItems,
      totalAmount,
      purchasedProducts,
      downloads,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Internal server error verifying payment', message: err?.message });
  }
});

// 4. GET /api/download/:token/:productId/:fileId - Protected Digital Asset Delivery
app.get('/api/download/:token/:productId/:fileId', (req, res) => {
  const { token, productId, fileId } = req.params;

  const order = tokenRegistry.get(token);
  if (!order) {
    return res.status(403).json({ error: 'Invalid or expired download authorization token.' });
  }

  // Check token age (24 hours max)
  const MAX_AGE_MS = 24 * 60 * 60 * 1000;
  if (Date.now() - order.createdAt > MAX_AGE_MS) {
    return res.status(403).json({ error: 'Download token has expired. Please contact support.' });
  }

  // Verify product was purchased in this order
  const hasPurchased = order.items.some((item) => item.productId === productId);
  if (!hasPurchased) {
    return res.status(403).json({ error: 'Unauthorized asset access. Product not in order.' });
  }

  const product = PRODUCTS.find((p) => p.id === productId);
  const downloadFile = product?.downloadFiles.find((f) => f.id === fileId);

  if (!product || !downloadFile) {
    return res.status(404).json({ error: 'Requested download file not found in catalog.' });
  }

  // Generate authentic digital asset bundle package text/zip payload
  const content = `=====================================================
PIYUSHRETENTION — DIGITAL ASSET LICENSED DELIVERY
=====================================================

Product: ${product.name} (${product.categoryLabel})
File: ${downloadFile.name} (${downloadFile.size})
Format: ${product.fileFormat}
Order ID: ${order.orderId}
License Holder: ${order.customerEmail}
Verified Date: ${new Date(order.createdAt).toISOString()}

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

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadFile.filename.replace(/\.zip$/i, '_QuickStart_Manifest.txt')}"`);
  res.send(content);
});

// Setup Vite middleware for local development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PiyushRetention Store Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
