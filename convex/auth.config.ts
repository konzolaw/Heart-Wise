export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL || "https://heartwise-mauve.vercel.app",
      applicationID: "convex",
    },
  ],
};
