module.exports = {
    webpack: {
      configure: {
        resolve: {
          fallback: {
            http: require.resolve("stream-http"),
            https: require.resolve("https-browserify"),
            stream: require.resolve("stream-browserify"),
            assert: require.resolve("assert/"),
            url: require.resolve("url/")
          }
        }
      }
    }
  };
  