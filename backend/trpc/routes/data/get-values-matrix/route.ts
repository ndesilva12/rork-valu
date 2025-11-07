import { publicProcedure } from "../../../create-context";
import { getValuesMatrixFromFirebase } from "../../../../services/firebase-data";

export const getValuesMatrixProcedure = publicProcedure.query(async () => {
  console.log('[tRPC] getValuesMatrix called');
  const matrix = await getValuesMatrixFromFirebase();
  console.log('[tRPC] Returning matrix with', Object.keys(matrix).length, 'values');
  return matrix;
});
