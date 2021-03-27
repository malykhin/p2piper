module.exports = {
  apps: [
    {
      name: 'p2piper',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        BASE_URL: 'http://p2piper-prod-alb-1781782710.us-east-1.elb.amazonaws.com',
        PORT: 80,
        ORIGIN: 'http://p2piper-prod-alb-1781782710.us-east-1.elb.amazonaws.com',
        REDIS_HOST: 'p2piper-prod-cluster-example.gxxc44.0001.use1.cache.amazonaws.com',
        REDIS_PORT: 6379,
        REDIS_USE_TLS: false,
        AWS_REGION: 'us-east-1',
        LOG_GROUP_NAME: 'p2piper',
        LOG_STREAM_NAME: 'p2piper-prod',
      },
    },
  ],
}
