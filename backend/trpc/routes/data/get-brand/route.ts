import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { getBrandById } from "../../../../services/firebase/dataService";

export const getBrandProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    // Load brand from Firebase
    const brand = await getBrandById(input.id);

    if (!brand) {
      throw new Error(`Brand not found: ${input.id}`);
    }

    return brand;
  });
