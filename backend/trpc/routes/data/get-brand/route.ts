import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { fetchBrandsFromSheets, fetchLocalBusinessesFromSheets } from "../../../../services/google-sheets";

/**
 * Normalize a string for comparison: lowercase, trim.
 */
function normalize(str?: string): string {
  return (str || "").toString().toLowerCase().trim();
}

/**
 * Create a simple slug from a name (letters/numbers and dashes).
 * e.g. "Uber Technologies, Inc." -> "uber-technologies-inc"
 */
function slugify(name?: string): string {
  return normalize(name)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Remove common prefixes used in ids like "brand-", "prod-", "local-".
 * e.g. "brand-uber" -> "uber"
 */
function stripCommonPrefixes(id?: string): string {
  return (id || "").toString().replace(/^(brand|prod|product|local)-/i, "");
}

export const getBrandProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    // Debug log: what the frontend requested
    console.log(`[getBrand] Request for brand id: "${input.id}"`);

    // Search in both brands and local businesses
    const [brands, businesses] = await Promise.all([
      fetchBrandsFromSheets(),
      fetchLocalBusinessesFromSheets(),
    ]);

    const allBrands = [...brands, ...businesses];

    // Prepare normalized forms of the incoming ID
    const requestedRaw = input.id;
    const requested = normalize(requestedRaw);
    const requestedSlug = slugify(requestedRaw);
    const requestedStripped = normalize(stripCommonPrefixes(requestedRaw));

    // Try multiple matching strategies to be tolerant of different id/name forms
    const brand = allBrands.find((b) => {
      const bId = normalize(b.id);
      const bName = normalize(b.name);
      const bSlug = slugify(b.name);
      const bIdStripped = normalize(stripCommonPrefixes(b.id));

      // exact id match
      if (bId === requested) return true;

      // exact name match
      if (bName === requested) return true;

      // slug match (when UI uses slug)
      if (bSlug === requested || bSlug === requestedSlug) return true;

      // match against stripped id (remove "brand-" prefixes)
      if (bIdStripped && bIdStripped === requestedStripped) return true;

      // match when requested equals stripped id or slug
      if (requested === bIdStripped) return true;

      return false;
    });

    if (!brand) {
      console.warn(`[getBrand] Brand not found for id: "${input.id}". Available brand ids (sample): ${allBrands.slice(0,20).map(b=>b.id).join(', ')}`);
      throw new Error(`Brand not found: ${input.id}`);
    }

    console.log(`[getBrand] Found brand: id="${brand.id}", name="${brand.name}" for request "${input.id}"`);
    return brand;
  });
