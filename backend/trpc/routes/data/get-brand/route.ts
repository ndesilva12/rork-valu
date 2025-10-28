import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { fetchBrandsFromSheets, fetchLocalBusinessesFromSheets } from "../../../../services/local-data";

export const getBrandProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    // Search in both brands and local businesses
    const [brands, businesses] = await Promise.all([
      fetchBrandsFromSheets(),
      fetchLocalBusinessesFromSheets(),
    ]);

    const allBrands = [...brands, ...businesses];
    const brand = allBrands.find((b) => b.id === input.id);

    if (!brand) {
      throw new Error(`Brand not found: ${input.id}`);
    }

    return brand;
  });
