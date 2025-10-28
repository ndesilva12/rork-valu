import { publicProcedure } from "../../../create-context";
import { getValuesMatrix } from "../../../../services/local-data";

export const getValuesMatrixProcedure = publicProcedure.query(async () => {
  console.log('[tRPC] getValuesMatrix called');
  const matrix = await getValuesMatrix();
  console.log('[tRPC] Returning matrix with', Object.keys(matrix).length, 'values');
  return matrix;
});
