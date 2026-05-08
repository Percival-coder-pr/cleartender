const REVIEW_PACKAGES = {
  'boq-check': {
    label: 'Tender Review',
    amount: 950
  },
  'tender-review': {
    label: 'Tender Review',
    amount: 950
  },
  'tender-pricing': {
    label: 'Tender Pricing',
    amount: 1950
  },
  'tender-pricing-review': {
    label: 'Tender Pricing Review',
    amount: 1950
  },
  'commercial-tender-review': {
    label: 'Commercial Tender Review',
    amount: 3950
  }
};

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function getRequestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';

  if (!host) return '';

  return `${proto}://${host}`;
}

function getSafeSuccessRedirect(req, redirectPath) {
  const origin = getRequestOrigin(req);

  if (!origin) return '';

  const fallback = new URL('/#payment', origin);
  if (!redirectPath) return fallback.toString();

  try {
    const url = new URL(String(redirectPath), origin);
    return url.origin === origin ? url.toString() : fallback.toString();
  } catch (_error) {
    return fallback.toString();
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const paymentPageUrl = process.env.YOCO_PAYMENT_PAGE_URL || process.env.YOCO_CHECKOUT_URL || '';
  if (!paymentPageUrl) {
    sendJson(res, 503, {
      error: 'Card checkout is not active yet. Use EFT on invoice or the manual review request form.'
    });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const packageId = String(body.packageId || '').trim();
    const selectedPackage = REVIEW_PACKAGES[packageId];
    const firstName = String(body.firstName || '').trim();
    const email = String(body.email || '').trim();
    const referenceSuffix = String(body.referenceSuffix || '').trim();

    if (!selectedPackage) {
      sendJson(res, 400, { error: 'Select a valid once-off ClearTender review package before checkout.' });
      return;
    }

    const url = new URL(paymentPageUrl);
    const reference = [selectedPackage.label, referenceSuffix].filter(Boolean).join(' - ');
    const redirectSuccess = getSafeSuccessRedirect(req, body.redirectPath);

    url.searchParams.set('amount', selectedPackage.amount.toFixed(2));
    url.searchParams.set('reference', reference);
    if (firstName) url.searchParams.set('firstName', firstName);
    if (email) url.searchParams.set('email', email);
    if (redirectSuccess) url.searchParams.set('redirectOnPaymentSuccess', redirectSuccess);

    sendJson(res, 200, {
      redirectUrl: url.toString(),
      provider: 'yoco',
      mode: 'hosted-payment-page',
      package: {
        id: packageId,
        label: selectedPackage.label,
        amount: selectedPackage.amount
      }
    });
  } catch (_error) {
    sendJson(res, 500, { error: 'Payment link could not be prepared.' });
  }
};
