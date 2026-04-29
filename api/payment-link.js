module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const paymentPageUrl = process.env.YOCO_PAYMENT_PAGE_URL || '';
  if (!paymentPageUrl) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Card checkout is not configured yet. Add YOCO_PAYMENT_PAGE_URL in Vercel, or use EFT on invoice or manual intake.'
    }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const amount = Number(body.amount || 0);
    const reference = String(body.reference || body.reviewPackage || 'ClearTender Review').trim();
    const firstName = String(body.firstName || '').trim();
    const email = String(body.email || '').trim();
    const redirectSuccess = String(body.redirectSuccess || '').trim();

    if (!amount || amount <= 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'A valid amount is required to create a payment link.' }));
      return;
    }

    const url = new URL(paymentPageUrl);
    url.searchParams.set('amount', amount.toFixed(2));
    url.searchParams.set('reference', reference);
    if (firstName) url.searchParams.set('firstName', firstName);
    if (email) url.searchParams.set('email', email);
    if (redirectSuccess) url.searchParams.set('redirectOnPaymentSuccess', redirectSuccess);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      redirectUrl: url.toString(),
      provider: 'yoco',
      mode: 'hosted-payment-page'
    }));
  } catch (_error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Payment link could not be prepared.' }));
  }
};
