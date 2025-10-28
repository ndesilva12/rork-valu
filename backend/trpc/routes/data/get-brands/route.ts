import { publicProcedure } from "../../../create-context";
import { fetchBrandsFromSheets } from "../../../../services/local-data";

export const getBrandsProcedure = publicProcedure.query(async () => {
  const brands = await fetchBrandsFromSheets();
  return brands;
});
