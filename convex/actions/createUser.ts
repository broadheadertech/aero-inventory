"use node";
import { action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * createUser — Admin-only action that creates a Clerk user AND a Convex users record.
 *
 * Must be a Convex action (not mutation) because it calls the Clerk Backend API
 * via fetch. Mutations cannot make external HTTP requests.
 *
 * REQUIRED: Set CLERK_SECRET_KEY in Convex environment:
 *   npx convex env set CLERK_SECRET_KEY sk_test_...
 *
 * Called from client via useAction(api.actions.createUser.createUser).
 *
 * Orphan prevention strategy:
 * 1. Pre-check email uniqueness in Convex BEFORE calling Clerk (fast-fail).
 * 2. If Convex createUserRecord mutation fails after Clerk user is created,
 *    issue a compensating DELETE to Clerk to avoid a permanently orphaned account.
 */
export const createUser = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(
      v.literal("Admin"),
      v.literal("Branch Manager"),
      v.literal("Branch Staff")
    ),
    branchIds: v.array(v.id("branches")),
  },
  handler: async (ctx, args) => {
    // Auth check — actions use ctx.runQuery instead of ctx.db
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const currentUser = (await ctx.runQuery(
      api.queries.getCurrentUser.getCurrentUser
    )) as { _id: Id<"users">; role: string } | null;

    if (!currentUser || currentUser.role !== "Admin") {
      throw new ConvexError("Forbidden: Admin access required");
    }

    // Server-side validation
    if (args.role !== "Admin" && args.branchIds.length === 0) {
      throw new ConvexError(
        "Branch assignment is required for Branch Manager and Branch Staff roles"
      );
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new ConvexError(
        "Server configuration error: CLERK_SECRET_KEY not set. Run: npx convex env set CLERK_SECRET_KEY <key>"
      );
    }

    // Pre-check email uniqueness in Convex before calling Clerk.
    // Prevents orphaned Clerk accounts when the Convex insert would fail anyway.
    const emailExists = await ctx.runQuery(
      internal.queries.checkEmailExists.checkEmailExists,
      { email: args.email }
    );
    if (emailExists) {
      throw new ConvexError(
        "A user with this email address already exists."
      );
    }

    // Call Clerk Backend API to create the Clerk user
    const clerkRes = await fetch("https://api.clerk.com/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: [args.email],
        first_name: args.name,
        password: args.password,
        public_metadata: { role: args.role },
        skip_password_checks: false,
      }),
    });

    if (!clerkRes.ok) {
      const errBody = await clerkRes.json().catch(() => ({}));
      const message =
        errBody?.errors?.[0]?.long_message ??
        errBody?.errors?.[0]?.message ??
        "Failed to create user. Please check the email and password.";
      throw new ConvexError(message);
    }

    const clerkUser = (await clerkRes.json()) as { id: string };

    // Create Convex users record via internal mutation.
    // Compensating transaction: if this fails, delete the Clerk user to prevent orphaning.
    try {
      await ctx.runMutation(
        internal.mutations.createUserRecord.createUserRecord,
        {
          clerkUserId: clerkUser.id,
          email: args.email,
          name: args.name,
          role: args.role,
          branchIds: args.branchIds,
          actorId: currentUser._id,
        }
      );
    } catch (mutationError) {
      // Compensating DELETE — best-effort; do not let a Clerk API failure mask the original error
      await fetch(`https://api.clerk.com/v1/users/${clerkUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      }).catch(() => undefined);
      throw mutationError;
    }
  },
});
