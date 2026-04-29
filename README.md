# ClearTender

Premium static landing page for ClearTender, a South African independent quote and tender pricing review service for contractors.

## What this project is

- Responsive single-page marketing site
- Self-contained HTML with embedded CSS and JavaScript
- Built to present the core offer, trust section, FAQ, and review request form

## Content included

- Hero
- Problem
- What ClearTender does
- How it works
- Onboarding
- Offers
- Payment facilities
- Sample review / redacted review trust section
- FAQ
- Upload tender documents form
- Final CTA
- Footer disclaimer

## Brand positioning

ClearTender is positioned as a premium, practical, commercially sharp, margin-conscious review service for South African building and civil contractors.

It is not positioned as:

- admin support
- virtual assistant work
- engineering signoff
- QS certification
- legal advice

## Local run

Open `index.html` directly in a browser.

## Deployment

This site is designed to deploy cleanly as a static site on Vercel.

If Vercel needs an explicit config, `vercel.json` keeps the project pinned to the site root.

## Onboarding and payment

- The landing page now includes a dedicated onboarding section and a payment facilities section.
- The intake form captures the selected review package and preferred payment method.
- The flow is static-safe and commercially honest: it supports booking, invoice, and payment-link handoff without pretending there is an active payment gateway backend where none has been configured yet.
- A provider-ready Yoco hosted payment flow is included through `api/payment-link.js`.
- ClearTender is aligned to the same legal/payment identity used by Kinwyse: `Subtle Consulting (Pty) Ltd`.
- Manual intake and payment support routes to `support@subtleconsulting.co.za`.

## Vercel environment variable

To activate live card checkout, set this in Vercel project settings:

- `YOCO_PAYMENT_PAGE_URL`
- or `YOCO_CHECKOUT_URL`

Expected format:

- `https://pay.yoco.com/your-payment-page`

The site will then generate prefilled hosted checkout links using Yoco-style payment page parameters for:

- `amount`
- `reference`
- `firstName`
- `email`
- `redirectOnPaymentSuccess`

## Primary CTA

`Request a Tender Review`
