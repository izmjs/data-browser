const SCOPE = 'data-browser';

module.exports = (config) => {
  const { env } = config.utils;

  return {
    'data-browser': {
      exampleVar: env.get('EXAMPLE_KEY', SCOPE),
    },
  };
};
