/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as dailyVerse from "../dailyVerse.js";
import type * as http from "../http.js";
import type * as posts from "../posts.js";
import type * as profiles from "../profiles.js";
import type * as router from "../router.js";
import type * as testimonies from "../testimonies.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  dailyVerse: typeof dailyVerse;
  http: typeof http;
  posts: typeof posts;
  profiles: typeof profiles;
  router: typeof router;
  testimonies: typeof testimonies;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
