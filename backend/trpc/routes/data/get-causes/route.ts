import { publicProcedure } from "../../../create-context";
import { fetchCausesFromSheets } from "../../../../services/google-sheets";

export const getCausesProcedure = publicProcedure.query(async () => {
  const causes = await fetchCausesFromSheets();
  return causes;
});
