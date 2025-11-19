import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { getFollowersCount, getFollowingCount } from "@/services/firebase/followService";

const GetCountsInputSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['user', 'brand', 'business']),
});

export const getCountsProcedure = protectedProcedure
  .input(GetCountsInputSchema)
  .query(async ({ ctx, input }) => {
    const followersCount = await getFollowersCount(input.entityId, input.entityType);
    const followingCount = await getFollowingCount(input.entityId);
    return { followersCount, followingCount };
  });
