const crypto = require('crypto');
const PaymentProvider = require('./PaymentProvider');
const env = require('../../config/env');

// Adapter for a Razorpay-compatible gateway (supports UPI, cards, netbanking).
// In sandbox/dev mode without real credentials configured, this adapter
// falls back to a deterministic mock so the rest of the flow is testable
// end-to-end without a live payment account.
class RazorpayProvider extends PaymentProvider {
  constructor({ key, secret, webhookSecret }) {
    super();
    this.key = key;
    this.secret = secret;
    this.webhookSecret = webhookSecret;
    this.sandboxMode = env.isTest || !key || !secret || key.includes('xxxx');
  }

  async createOrder({ amountPaise, receiptId, notes }) {
    if (this.sandboxMode) {
      // Deterministic mock order for local development/testing.
      const providerOrderId = `order_mock_${receiptId}`;
      return { providerOrderId, raw: { amountPaise, receiptId, notes, mock: true } };
    }

    // Real integration point. Left as a clearly-marked TODO since actual
    // network calls require live credentials not available in this
    // environment. Swap in the real Razorpay SDK/HTTP call here.
    //
    // Example (with the `razorpay` npm package):
    //   const Razorpay = require('razorpay');
    //   const instance = new Razorpay({ key_id: this.key, key_secret: this.secret });
    //   const order = await instance.orders.create({
    //     amount: amountPaise, currency: 'INR', receipt: receiptId, notes,
    //   });
    //   return { providerOrderId: order.id, raw: order };
    throw new Error('Live RazorpayProvider.createOrder not configured. Set PAYMENT_KEY/PAYMENT_SECRET.');
  }

  async verifyPayment({ providerOrderId, providerPaymentId, providerSignature }) {
    if (this.sandboxMode) {
      // Mock verification: accept any payment id that looks well-formed
      // and whose signature matches our own HMAC of order+payment id,
      // computed with the (mock) secret. This lets integration tests
      // exercise the full verify path deterministically.
      const expected = this._computeSignature(providerOrderId, providerPaymentId, 'mock_secret');
      const verified = providerSignature === expected;
      return { verified, amountPaise: null, status: verified ? 'captured' : 'failed' };
    }

    // Real integration point: verify HMAC-SHA256 signature per Razorpay's
    // documented scheme: hmac_sha256(order_id + "|" + payment_id, key_secret)
    const expected = this._computeSignature(providerOrderId, providerPaymentId, this.secret);
    const verified = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(providerSignature.padEnd(expected.length, '0').slice(0, expected.length), 'hex')
    );
    // In a real integration, also fetch the payment server-side via the
    // provider API to confirm amount/status rather than trusting the
    // signature alone. Left as an integration TODO for the real key setup.
    return { verified, amountPaise: null, status: verified ? 'captured' : 'failed' };
  }

  async parseWebhook({ rawBody, signatureHeader }) {
    const secret = this.webhookSecret || 'mock_webhook_secret';
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const valid = signatureHeader === expected;
    let event = null;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch (err) {
      return { valid: false, event: null };
    }
    return { valid, event };
  }

  _computeSignature(orderId, paymentId, secret) {
    return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  }
}

module.exports = new RazorpayProvider({
  key: env.payment.key,
  secret: env.payment.secret,
  webhookSecret: env.payment.webhookSecret,
});
