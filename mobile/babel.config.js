module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Evolu uses the `using` statement.
    plugins: ['@babel/plugin-transform-explicit-resource-management'],
  };
};
