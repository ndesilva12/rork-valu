import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { unfollowEntity } from "@/services/firebase/followService";

const UnfollowInputSchema = z.object({
  followedId: z.string(),
  followedType: z.enum(['user', 'brand', 'business']),
});

export const unfollowProcedure = protectedProcedure
  .input(UnfollowInputSchema)
  .mutation(async ({ ctx, input }) => {
    await unfollowEntity(ctx.userId, input.followedId, input.followedType);
    return { success: true };
  });
