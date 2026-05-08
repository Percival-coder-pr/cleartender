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

<<<<<<< HEAD
=======
const MAX_REFERENCE_SUFFIX_LENGTH = 120;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_REDIRECT_PATH_LENGTH = 2048;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

>>>>>>> 3998846 (Harden ClearTender checkout and intake against malformed input)
function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

<<<<<<< HEAD
=======
function parseRequestBody(rawBody) {
  if (rawBody == null || rawBody === '') {
    return {};
  }

  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody);
    } catch (_error) {
      throw new Error('INVALID_JSON');
    }
  }

  if (rawBody instanceof ArrayBuffer) {
    try {
      return JSON.parse(new TextDecoder().decode(rawBody));
    } catch (_error) {
      throw new Error('INVALID_JSON');
    }
  }

  if (rawBody && typeof rawBody === 'object') {
    return rawBody;
  }

  throw new Error('INVALID_PAYLOAD');
}

function toSafeTrimmedString(value, maxLength = 0) {
  if (value == null) return '';
  return String(value).replace(/[\r\n\t]/g, ' ').trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return !!value && EMAIL_REGEX.test(value);
}

>>>>>>> 3998846 (Harden ClearTender checkout and intake against malformed input)
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
<<<<<<< HEAD
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const packageId = String(body.packageId || '').trim();
    const selectedPackage = REVIEW_PACKAGES[packageId];
    const firstName = String(body.firstName || '').trim();
    const email = String(body.email || '').trim();
    const referenceSuffix = String(body.referenceSuffix || '').trim();

=======
    const body = parseRequestBody(req.body);
    const packageId = toSafeTrimmedString(body.packageId, 48);
    const selectedPackage = REVIEW_PACKAGES[packageId];
    const firstName = toSafeTrimmedString(body.firstName, MAX_NAME_LENGTH);
    const email = toSafeTrimmedString(body.email, MAX_EMAIL_LENGTH);
    const referenceSuffix = toSafeTrimmedString(body.referenceSuffix, MAX_REFERENCE_SUFFIX_LENGTH);
    const redirectPath = toSafeTrimmedString(body.redirectPath, MAX_REDIRECT_PATH_LENGTH);

    if (!firstName) {
      sendJson(res, 400, { error: 'A client name is required for checkout metadata.' });
      return;
    }

    if (!isValidEmail(email)) {
      sendJson(res, 400, { error: 'A valid email address is required for checkout metadata.' });
      return;
    }

>>>>>>> 3998846 (Harden ClearTender checkout and intake against malformed input)
    if (!selectedPackage) {
      sendJson(res, 400, { error: 'Select a valid once-off ClearTender review package before checkout.' });
      return;
    }

    const url = new URL(paymentPageUrl);
    const reference = [selectedPackage.label, referenceSuffix].filter(Boolean).join(' - ');
<<<<<<< HEAD
    const redirectSuccess = getSafeSuccessRedirect(req, body.redirectPath);
=======
    const redirectSuccess = getSafeSuccessRedirect(req, redirectPath);
>>>>>>> 3998846 (Harden ClearTender checkout and intake against malformed input)

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
<<<<<<< HEAD
=======
    if (String(_error?.message || '').includes('INVALID_')) {
      sendJson(res, 400, { error: 'Invalid request payload.' });
      return;
    }

>>>>>>> 3998846 (Harden ClearTender checkout and intake against malformed input)
    sendJson(res, 500, { error: 'Payment link could not be prepared.' });
  }
};
