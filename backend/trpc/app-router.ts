import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getProfileProcedure } from "./routes/user/get-profile/route";
import { saveProfileProcedure } from "./routes/user/save-profile/route";
import { autocompleteProcedure } from "./routes/location/autocomplete/route";
import { placeDetailsProcedure } from "./routes/location/place-details/route";
import { getArticlesProcedure } from "./routes/news/get-articles/route";
import { followProcedure } from "./routes/follow/follow/route";
import { unfollowProcedure } from "./routes/follow/unfollow/route";
import { isFollowingProcedure } from "./routes/follow/isFollowing/route";
import { getCountsProcedure } from "./routes/follow/getCounts/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  user: createTRPCRouter({
    getProfile: getProfileProcedure,
    saveProfile: saveProfileProcedure,
  }),
  location: createTRPCRouter({
    autocomplete: autocompleteProcedure,
    placeDetails: placeDetailsProcedure,
  }),
  news: createTRPCRouter({
    getArticles: getArticlesProcedure,
  }),
  follow: createTRPCRouter({
    follow: followProcedure,
    unfollow: unfollowProcedure,
    isFollowing: isFollowingProcedure,
    getCounts: getCountsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
