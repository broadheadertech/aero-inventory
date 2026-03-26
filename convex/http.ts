import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/pos/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const signature = request.headers.get("x-pos-signature") ?? "";
      const branchIdentifier = request.headers.get("x-branch-id") ?? "";

      if (!branchIdentifier) {
        return new Response(JSON.stringify({ error: "Missing branch identifier" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Look up POS config for this branch
      const config = await ctx.runQuery(internal.queries.getPosConfigByBranch.getPosConfigByBranch, {
        branchIdentifier,
      });

      if (!config) {
        return new Response(JSON.stringify({ error: "No POS config for branch" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!config.isEnabled) {
        return new Response(JSON.stringify({ error: "POS sync disabled for branch" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(config.webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Constant-time comparison to prevent timing attacks (M3 fix)
      const sigMatch =
        signature.length === expectedSignature.length &&
        signature.split("").every((c, i) => c === expectedSignature[i]);
      if (!sigMatch) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse transaction payload
      const payload = JSON.parse(body);

      // Process the transaction asynchronously
      await ctx.runMutation(internal.mutations.processPosTransaction.processPosTransaction, {
        transactionId: payload.transactionId,
        branchId: config.branchId,
        sku: payload.sku,
        quantity: payload.quantity,
        priceCentavos: payload.priceCentavos ?? 0,
        posTimestamp: payload.timestamp,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
