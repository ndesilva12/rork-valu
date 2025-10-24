import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { fetchProductsFromSheets, searchProducts } from "../../../../services/google-sheets";

export const searchProductsProcedure = publicProcedure
  .input(
    z.object({
      query: z.string(),
      userCauses: z.array(z.string()).optional().default([]),
    })
  )
  .query(async ({ input }) => {
    const allProducts = await fetchProductsFromSheets();
    const results = searchProducts(allProducts, input.query, input.userCauses);
    return results;
  });
