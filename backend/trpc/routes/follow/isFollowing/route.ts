import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { isFollowing } from "@/services/firebase/followService";

const IsFollowingInputSchema = z.object({
  followedId: z.string(),
  followedType: z.enum(['user', 'brand', 'business']),
});

export const isFollowingProcedure = protectedProcedure
  .input(IsFollowingInputSchema)
  .query(async ({ ctx, input }) => {
    const following = await isFollowing(ctx.userId, input.followedId, input.followedType);
    return { isFollowing: following };
  });
