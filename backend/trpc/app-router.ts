import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfileProcedure } from "./routes/user/get-profile/route";
import { saveProfileProcedure } from "./routes/user/save-profile/route";
import { getCausesProcedure } from "./routes/data/get-causes/route";
import { getProductsProcedure } from "./routes/data/get-products/route";
import { getLocalBusinessesProcedure } from "./routes/data/get-local-businesses/route";
import { searchProductsProcedure } from "./routes/data/search-products/route";
import { getProductProcedure } from "./routes/data/get-product/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  user: createTRPCRouter({
    getProfile: getProfileProcedure,
    saveProfile: saveProfileProcedure,
  }),
  data: createTRPCRouter({
    getCauses: getCausesProcedure,
    getProducts: getProductsProcedure,
    getLocalBusinesses: getLocalBusinessesProcedure,
    searchProducts: searchProductsProcedure,
    getProduct: getProductProcedure,
  }),
});

export type AppRouter = typeof appRouter;
