import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { saveUserProfile } from "../../../db";

const CauseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['social_issue', 'religion', 'ideology', 'corporation', 'nation', 'organization', 'person']),
  type: z.enum(['support', 'avoid']),
  description: z.string().optional(),
});

const ProfileSchema = z.object({
  causes: z.array(CauseSchema),
  searchHistory: z.array(z.string()),
});

export const saveProfileProcedure = protectedProcedure
  .input(ProfileSchema)
  .mutation(async ({ ctx, input }) => {
    await saveUserProfile(ctx.userId, input);
    return { success: true };
  });
