import { publicProcedure } from "../../../create-context";
import { fetchLocalBusinessesFromFirebase } from "../../../../services/firebase-data";

export const getLocalBusinessesProcedure = publicProcedure.query(async () => {
  const businesses = await fetchLocalBusinessesFromFirebase();
  return businesses;
});
