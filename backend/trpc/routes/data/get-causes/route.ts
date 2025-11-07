import { publicProcedure } from "../../../create-context";
import { fetchValuesFromFirebase } from "../../../../services/firebase-data";

export const getCausesProcedure = publicProcedure.query(async () => {
  const causes = await fetchValuesFromFirebase();
  return causes;
});
