import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { fetchProductsFromSheets, fetchLocalBusinessesFromSheets } from "../../../../services/google-sheets";

export const getProductProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    // Search in both products and local businesses
    const [products, businesses] = await Promise.all([
      fetchProductsFromSheets(),
      fetchLocalBusinessesFromSheets(),
    ]);

    const allItems = [...products, ...businesses];
    const product = allItems.find((p) => p.id === input.id);

    if (!product) {
      throw new Error(`Product not found: ${input.id}`);
    }

    return product;
  });
