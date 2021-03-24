import { config as dotenv } from 'dotenv'

dotenv()

interface IConfig {
  isLive: boolean
  port: number
  origin: string
  redisHost: string
  redisPort: number
  useTLS: boolean
  awsRegion: string
  logGroupName: string
  logStreamName: string
}

const config: IConfig = {
  isLive: !['local', 'development'].includes(process.env.APP_ENV ?? ''),
  port: +(process.env.PORT ?? 0),
  origin: process.env.ORIGIN ?? '',
  redisHost: process.env.REDIS_HOST ?? '',
  redisPort: +(process.env.REDIS_PORT ?? 0),
  useTLS: process.env.REDIS_USE_TLS === 'true',
  awsRegion: process.env.AWS_REGION ?? '',
  logGroupName: process.env.LOG_GROUP_NAME ?? '',
  logStreamName: process.env.LOG_STREAM_NAME ?? '',
}

export default config
