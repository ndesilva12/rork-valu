import { publicProcedure } from "../../../create-context";
import { fetchBrandsFromSheets } from "../../../../services/google-sheets";

export const getBrandsProcedure = publicProcedure.query(async () => {
  const brands = await fetchBrandsFromSheets();
  return brands;
});
