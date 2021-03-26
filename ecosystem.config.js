module.exports = {
  apps: [
    {
      name: 'p2piper',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        BASE_URL: 'http://p2piper.com',
        PORT: 80,
        ORIGIN: 'http://p2piper.com:80',
        REDIS_HOST: 'p2piper-prod-cluster-example.gxxc44.0001.use1.cache.amazonaws.com',
        REDIS_PORT: 6379,
        REDIS_USE_TLS: true,
        AWS_REGION: 'us-east-1',
        LOG_GROUP_NAME: 'p2piper',
        LOG_STREAM_NAME: 'p2piper-prod',
      },
    },
  ],
}
