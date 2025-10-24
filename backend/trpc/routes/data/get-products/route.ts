import { publicProcedure } from "../../../create-context";
import { fetchProductsFromSheets } from "../../../../services/google-sheets";

export const getProductsProcedure = publicProcedure.query(async () => {
  const products = await fetchProductsFromSheets();
  return products;
});
