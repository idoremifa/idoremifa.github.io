export const SITE = {
  website: "https://itsido.com/",
  author: "Ido",
  profile: "https://github.com/idoremifa",
  desc: "Notes on software, things I'm learning, and what I'm building.",
  title: "It's Ido",
  ogImage: "og.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button on the post detail page
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/idoremifa/idoremifa.github.io/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // HTML lang code. Leave empty to default to "en"
  timezone: "Asia/Seoul", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;

export const ANALYTICS = {
  googleAnalyticsId: "G-LY9JMQG9L6",
  googleSiteVerification: "4dYqMmKna5Ik7dOKJh6MfJAwdyBWRSEyMzbXEUu2PDI",
} as const;

export const GISCUS = {
  enabled: true,
  repo: "idoremifa/idoremifa.github.io",
  repoId: "R_kgDOSAUgiA",
  category: "Comments",
  categoryId: "DIC_kwDOSAUgiM4C7t7l",
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top",
  lang: "en",
  loading: "lazy",
} as const;
