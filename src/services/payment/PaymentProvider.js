// Abstract interface every payment provider adapter must implement.
// This indirection means the concrete gateway (Razorpay, Cashfree, etc.)
// can be swapped without touching paymentService or controllers.
class PaymentProvider {
  /**
   * Create an order/intent with the provider for the given amount.
   * @returns {Promise<{ providerOrderId: string, raw: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async createOrder({ amountPaise, receiptId, notes }) {
    throw new Error('createOrder must be implemented by provider adapter');
  }

  /**
   * Independently verify a payment against the provider (signature
   * verification and/or a server-to-server status fetch). Must NEVER
   * trust a "success" flag sent only by the frontend.
   * @returns {Promise<{ verified: boolean, amountPaise: number, status: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async verifyPayment({ providerOrderId, providerPaymentId, providerSignature }) {
    throw new Error('verifyPayment must be implemented by provider adapter');
  }

  /**
   * Validate an inbound webhook's authenticity (signature check) and
   * return normalized event data.
   * @returns {Promise<{ valid: boolean, event: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async parseWebhook({ rawBody, signatureHeader }) {
    throw new Error('parseWebhook must be implemented by provider adapter');
  }
}

module.exports = PaymentProvider;
