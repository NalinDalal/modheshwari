// next-i18next.config.js
module.exports = {
  i18n: {
    locales: ["en", "hi"], // Add the languages you want (English and Hindi)
    defaultLocale: "en",
  },
  reloadOnPrerender: process.env.NODE_ENV === "development",
};
