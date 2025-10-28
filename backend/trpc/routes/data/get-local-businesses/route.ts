import { publicProcedure } from "../../../create-context";
import { fetchLocalBusinessesFromSheets } from "../../../../services/local-data";

export const getLocalBusinessesProcedure = publicProcedure.query(async () => {
  const businesses = await fetchLocalBusinessesFromSheets();
  return businesses;
});
