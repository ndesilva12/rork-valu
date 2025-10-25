import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfileProcedure } from "./routes/user/get-profile/route";
import { saveProfileProcedure } from "./routes/user/save-profile/route";
import { getCausesProcedure } from "./routes/data/get-causes/route";
import { getBrandsProcedure } from "./routes/data/get-brands/route";
import { getLocalBusinessesProcedure } from "./routes/data/get-local-businesses/route";
import { searchBrandsProcedure } from "./routes/data/search-brands/route";
import { getBrandProcedure } from "./routes/data/get-brand/route";
import { getScoredBrandsProcedure } from "./routes/data/get-scored-brands/route";

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
    getBrands: getBrandsProcedure,
    getLocalBusinesses: getLocalBusinessesProcedure,
    searchBrands: searchBrandsProcedure,
    getBrand: getBrandProcedure,
    getScoredBrands: getScoredBrandsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
