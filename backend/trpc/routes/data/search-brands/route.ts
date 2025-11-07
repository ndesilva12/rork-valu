import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { fetchBrandsFromFirebase, searchBrands } from "../../../../services/firebase-data";

export const searchBrandsProcedure = publicProcedure
  .input(
    z.object({
      query: z.string(),
      userCauses: z.array(z.string()).optional().default([]),
    })
  )
  .query(async ({ input }) => {
    const allBrands = await fetchBrandsFromFirebase();
    const results = searchBrands(allBrands, input.query, input.userCauses);
    return results;
  });
