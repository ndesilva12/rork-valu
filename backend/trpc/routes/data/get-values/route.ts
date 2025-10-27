import { publicProcedure } from "../../../create-context";
import { fetchValuesFromSheets } from "../../../../services/google-sheets";

export const getValuesProcedure = publicProcedure.query(async () => {
  const values = await fetchValuesFromSheets();
  return values;
});
