import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { followEntity } from "@/services/firebase/followService";

const FollowInputSchema = z.object({
  followedId: z.string(),
  followedType: z.enum(['user', 'brand', 'business']),
});

export const followProcedure = protectedProcedure
  .input(FollowInputSchema)
  .mutation(async ({ ctx, input }) => {
    await followEntity(ctx.userId, input.followedId, input.followedType);
    return { success: true };
  });
