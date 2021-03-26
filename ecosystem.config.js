module.exports = {
  apps: [
    {
      name: 'p2piper',
      script: '/home/ubuntu/app/build/index.js',
      env: {
        APP_ENV: 'production',
        BASE_URL: 'http://p2piper.com/',
        PORT: 80,
        ORIGIN: 'http://p2piper.com/',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_USE_TLS: true,
        AWS_REGION: 'us-east-1',
        LOG_GROUP_NAME: 'p2piper',
        LOG_STREAM_NAME: 'p2piper-prod',
      },
    },
  ],
}
