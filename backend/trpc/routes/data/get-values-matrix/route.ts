import { publicProcedure } from "../../../create-context";
import { getValuesMatrix } from "../../../../services/local-data";

export const getValuesMatrixProcedure = publicProcedure.query(async () => {
  const matrix = getValuesMatrix();
  return matrix;
});
