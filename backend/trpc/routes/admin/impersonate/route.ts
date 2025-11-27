import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createClerkClient } from "@clerk/backend";

// Admin user IDs that are allowed to impersonate
const ADMIN_USER_IDS = [
  process.env.ADMIN_USER_ID_1,
  process.env.ADMIN_USER_ID_2,
  // Add more admin user IDs as needed
].filter(Boolean);

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const impersonateProcedure = protectedProcedure
  .input(z.object({
    targetUserId: z.string().min(1, "Target user ID is required"),
  }))
  .mutation(async ({ ctx, input }) => {
    // Check if the current user is an admin
    if (!ADMIN_USER_IDS.includes(ctx.userId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can impersonate users",
      });
    }

    // Don't allow impersonating yourself
    if (ctx.userId === input.targetUserId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot impersonate yourself",
      });
    }

    try {
      // Verify the target user exists
      const targetUser = await clerkClient.users.getUser(input.targetUserId);
      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target user not found in Clerk",
        });
      }

      // Create a sign-in token for the target user
      // This token allows one-time sign-in as the target user
      const signInToken = await clerkClient.signInTokens.createSignInToken({
        userId: input.targetUserId,
        expiresInSeconds: 300, // 5 minutes
      });

      // Build the sign-in URL
      // The token can be used with Clerk's sign-in flow
      const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://iendorse.app';
      const signInUrl = `${baseUrl}/sign-in?__clerk_ticket=${signInToken.token}`;

      return {
        success: true,
        signInUrl,
        expiresAt: new Date(Date.now() + 300 * 1000).toISOString(),
        targetUserEmail: targetUser.emailAddresses[0]?.emailAddress,
        targetUserName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || 'Unknown',
      };
    } catch (error: any) {
      console.error("[Impersonate] Error creating sign-in token:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to create impersonation token",
      });
    }
  });
