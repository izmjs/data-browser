const SCOPE = 'data-browser';

module.exports = (config) => {
  const { env } = config.utils;

  return {
    'data-browser': {
      addIamToGuest: env.get('ADD_IAM_TO_GUEST', SCOPE),
      monitoring: {
        enable: env.get('MONITORING_ENABLE', SCOPE),
        interval: env.get('MONITORING_INTERVAL', SCOPE),
      },
    },
  };
};
