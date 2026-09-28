// File: api/auth/callback.js

export default async function handler(req, res) {
  console.log("=== CALLBACK ENDPOINT HIT ===");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);
  console.log("Request headers:", JSON.stringify(req.headers));

  try {
    // Parse query params manually from URL (works in both Node.js and Edge)
    const url = new URL(
      req.url,
      `https://${req.headers.host || "sample-cart-return-api.vercel.app"}`
    );
    const code = url.searchParams.get("code");
    const shop = url.searchParams.get("shop");

    console.log("Parsed URL:", url.toString());
    console.log("code:", code);
    console.log("shop:", shop);

    if (!code || !shop) {
      console.error("Missing code or shop parameter");
      return res.status(400).send("Missing code or shop parameter.");
    }

    // Validate shop domain format
    const shopDomain = String(shop).trim().toLowerCase();
    if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shopDomain)) {
      console.error("Invalid shop domain:", shopDomain);
      return res.status(400).send("Invalid shop domain.");
    }

    // These should be your app's Admin API key and secret
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    console.log("Client ID present:", !!clientId);
    console.log("Client Secret present:", !!clientSecret);

    if (!clientId || !clientSecret) {
      console.error("Missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET");
      return res
        .status(500)
        .send("Server configuration error: missing credentials.");
    }

    const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;

    console.log("Exchanging code for token at:", tokenUrl);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    console.log("Shopify response status:", response.status);
    console.log(
      "Shopify response content-type:",
      response.headers.get("content-type")
    );

    const responseText = await response.text();
    console.log(
      "Shopify response body (first 500 chars):",
      responseText.substring(0, 500)
    );

    // Check if response is HTML (error page)
    if (
      responseText.trim().startsWith("<!DOCTYPE") ||
      responseText.trim().startsWith("<html")
    ) {
      console.error("Shopify returned HTML instead of JSON");
      return res.status(500).send(
        "Shopify returned an HTML error page instead of JSON. " +
          "Check that the shop domain is correct and the app is installed."
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
      return res
        .status(500)
        .send(
          "Invalid response from Shopify: " +
            responseText.substring(0, 200)
        );
    }

    if (data.access_token) {
      console.log("===========================================");
      console.log("NEW OFFLINE TOKEN:", data.access_token);
      console.log("SCOPES:", data.scope);
      console.log("===========================================");
      console.log(
        "Copy this token into your Vercel env as SHOPIFY_ADMIN_ACCESS_TOKEN."
      );

      // For a single-shop setup, we don't need to persist the token here.
      // You just install once, grab the token from logs, and store it in env.
      return res.redirect(302, "/pages/order-status?installed=1");
    } else {
      console.error("Token exchange failed:", data);
      return res
        .status(500)
        .send("Authentication failed: " + JSON.stringify(data));
    }
  } catch (error) {
    console.error("=== CALLBACK ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return res
      .status(500)
      .send("An unexpected error occurred: " + error.message);
  }
}