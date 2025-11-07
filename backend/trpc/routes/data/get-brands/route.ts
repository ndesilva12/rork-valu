import { publicProcedure } from "../../../create-context";
import { fetchBrandsFromFirebase } from "../../../../services/firebase-data";

export const getBrandsProcedure = publicProcedure.query(async () => {
  const brands = await fetchBrandsFromFirebase();
  return brands;
});
