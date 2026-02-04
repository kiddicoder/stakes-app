const { expoRouterBabelPlugin } = require("babel-preset-expo/build/expo-router-plugin");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // In npm workspaces, expo-router may not be resolvable from the root node_modules,
    // so we add the router transform explicitly.
    plugins: [expoRouterBabelPlugin]
  };
};
