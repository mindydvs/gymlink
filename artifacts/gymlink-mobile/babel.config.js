const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@workspace/api-client-react": path.join(__dirname, "lib/api-client"),
          },
        },
      ],
    ],
  };
};
