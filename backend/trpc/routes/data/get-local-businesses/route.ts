import { publicProcedure } from "../../../create-context";
import { fetchLocalBusinessesFromSheets } from "../../../../services/google-sheets";

export const getLocalBusinessesProcedure = publicProcedure.query(async () => {
  const businesses = await fetchLocalBusinessesFromSheets();
  return businesses;
});
