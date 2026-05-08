const assert = require('node:assert/strict');
const test = require('node:test');

const handler = require('../api/payment-link');

function callPaymentLink({ method = 'POST', body = {}, envUrl = 'https://pay.yoco.com/merchant' } = {}) {
  const previousPaymentPageUrl = process.env.YOCO_PAYMENT_PAGE_URL;
  const previousCheckoutUrl = process.env.YOCO_CHECKOUT_URL;

  process.env.YOCO_PAYMENT_PAGE_URL = envUrl;
  delete process.env.YOCO_CHECKOUT_URL;

  return new Promise((resolve) => {
    const req = {
      method,
      headers: {
        host: 'cleartender.vercel.app',
        'x-forwarded-proto': 'https'
      },
      body
    };

    const res = {
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      end(payload) {
        if (previousPaymentPageUrl === undefined) {
          delete process.env.YOCO_PAYMENT_PAGE_URL;
        } else {
          process.env.YOCO_PAYMENT_PAGE_URL = previousPaymentPageUrl;
        }

        if (previousCheckoutUrl === undefined) {
          delete process.env.YOCO_CHECKOUT_URL;
        } else {
          process.env.YOCO_CHECKOUT_URL = previousCheckoutUrl;
        }

        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: JSON.parse(payload)
        });
      }
    };

    handler(req, res);
  });
}

test('uses server-owned package pricing for both legacy and tender-review packages', async () => {
  const response = await callPaymentLink({
    body: {
      packageId: 'tender-review',
      amount: 1,
      referenceSuffix: 'ACME Builders'
    }
  });

  assert.equal(response.statusCode, 200);
  const redirectUrl = new URL(response.body.redirectUrl);

  assert.equal(redirectUrl.searchParams.get('amount'), '950.00');
  assert.equal(redirectUrl.searchParams.get('reference'), 'Tender Review - ACME Builders');
  assert.deepEqual(response.body.package, {
    id: 'tender-review',
    label: 'Tender Review',
    amount: 950
  });

  const legacyResponse = await callPaymentLink({
    body: {
      packageId: 'boq-check',
      amount: 1,
      referenceSuffix: 'Legacy'
    }
  });

  assert.equal(legacyResponse.statusCode, 200);
  const legacyRedirect = new URL(legacyResponse.body.redirectUrl);

  assert.equal(legacyRedirect.searchParams.get('amount'), '950.00');
  assert.equal(legacyRedirect.searchParams.get('reference'), 'Tender Review - Legacy');
  assert.deepEqual(legacyResponse.body.package, {
    id: 'boq-check',
    label: 'Tender Review',
    amount: 950
  });

  const pricing = await callPaymentLink({
    body: {
      packageId: 'tender-pricing',
      referenceSuffix: 'ACME Builders - Tender Pack'
    }
  });

  assert.equal(pricing.statusCode, 200);
  const pricingRedirect = new URL(pricing.body.redirectUrl);

  assert.equal(pricingRedirect.searchParams.get('amount'), '1950.00');
  assert.equal(pricingRedirect.searchParams.get('reference'), 'Tender Pricing - ACME Builders - Tender Pack');
  assert.deepEqual(pricing.body.package, {
    id: 'tender-pricing',
    label: 'Tender Pricing',
    amount: 1950
  });
});

test('rejects monthly billing and unknown package ids for card checkout', async () => {
  const monthly = await callPaymentLink({ body: { packageId: 'pricing-desk' } });
  const unknown = await callPaymentLink({ body: { packageId: 'discounted-review' } });

  assert.equal(monthly.statusCode, 400);
  assert.equal(unknown.statusCode, 400);
});

test('keeps success redirects on the ClearTender origin', async () => {
  const response = await callPaymentLink({
    body: {
      packageId: 'commercial-tender-review',
      redirectPath: 'https://example.com/paid'
    }
  });

  assert.equal(response.statusCode, 200);
  const redirectUrl = new URL(response.body.redirectUrl);

  assert.equal(
    redirectUrl.searchParams.get('redirectOnPaymentSuccess'),
    'https://cleartender.vercel.app/#payment'
  );
});

test('returns a clear unavailable response when checkout is not configured', async () => {
  const response = await callPaymentLink({
    body: { packageId: 'boq-check' },
    envUrl: ''
  });

  assert.equal(response.statusCode, 503);
  assert.equal(
    response.body.error,
    'Card checkout is not active yet. Use EFT on invoice or the manual review request form.'
  );
});

test('rejects unsupported methods', async () => {
  const response = await callPaymentLink({ method: 'GET' });

  assert.equal(response.statusCode, 405);
});
