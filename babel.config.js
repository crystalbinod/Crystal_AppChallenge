module.exports = function (api) {
    //Boost speed for builds and reloads
  api.cache(true);
  // Return the Babel configuration object
  return {
    // Use the Expo preset, which includes default Babel settings for Expo projects
    presets: ['babel-preset-expo'],
    // Add the Reanimated plugin, required for using react-native-reanimated
    plugins: ['react-native-reanimated/plugin'],
  };
};
