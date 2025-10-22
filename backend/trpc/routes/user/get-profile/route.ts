import { protectedProcedure } from "../../../create-context";
import { getUserProfile } from "../../../db";

export const getProfileProcedure = protectedProcedure.query(async ({ ctx }) => {
  const profile = await getUserProfile(ctx.userId);
  return profile;
});
