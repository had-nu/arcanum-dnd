export default {
  arcanum: {
    input: {
      target: '../shared/openapi.yaml',
    },
    output: {
      target: './src/api/client.ts',
      client: 'fetch',
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
};