// File: api/auth/install.js

export default function handler(req, res) {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  // Basic validation
  const shopDomain = String(shop).trim().toLowerCase();
  if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shopDomain)) {
    return res.status(400).send("Invalid shop domain.");
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri = "https://sample-cart-return-api.vercel.app/api/auth/callback";
  const scopes = "read_orders"; // TODO: palitan ayon sa kailangan ng app mo
  const state = "some-random-string"; // ideally random per request

  const installUrl =
    `https://${shopDomain}/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  return res.redirect(302, installUrl);
}