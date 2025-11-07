import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfileProcedure } from "./routes/user/get-profile/route";
import { saveProfileProcedure } from "./routes/user/save-profile/route";
import { getBrandProcedure } from "./routes/data/get-brand/route";
import { autocompleteProcedure } from "./routes/location/autocomplete/route";
import { placeDetailsProcedure } from "./routes/location/place-details/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  user: createTRPCRouter({
    getProfile: getProfileProcedure,
    saveProfile: saveProfileProcedure,
  }),
  data: createTRPCRouter({
    getBrand: getBrandProcedure,
  }),
  location: createTRPCRouter({
    autocomplete: autocompleteProcedure,
    placeDetails: placeDetailsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
