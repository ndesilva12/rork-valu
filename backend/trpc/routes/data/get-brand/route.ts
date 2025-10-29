import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { fetchBrandsFromSheets, fetchLocalBusinessesFromSheets } from "../../../../services/local-data";

// Helper to slugify a string (convert to lowercase, replace spaces/special chars with hyphens)
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

export const getBrandProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    // Search in both brands and local businesses
    const [brands, businesses] = await Promise.all([
      fetchBrandsFromSheets(),
      fetchLocalBusinessesFromSheets(),
    ]);

    const allBrands = [...brands, ...businesses];

    // Try exact match first
    let brand = allBrands.find((b) => b.id === input.id);

    // If not found, try slugified match (for backwards compatibility with search)
    if (!brand) {
      const inputSlug = slugify(input.id);
      brand = allBrands.find((b) => slugify(b.id) === inputSlug || slugify(b.name) === inputSlug);
    }

    if (!brand) {
      throw new Error(`Brand not found: ${input.id}`);
    }

    return brand;
  });
