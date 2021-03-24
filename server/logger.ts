import winston from 'winston'
import WinstonCloudWatch from 'winston-cloudwatch'
import AWS from 'aws-sdk'

import config from './config'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'data_sync' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

if (config.isLive) {
  AWS.config.update({
    region: config.awsRegion,
  })

  logger.add(
    new WinstonCloudWatch({
      cloudWatchLogs: new AWS.CloudWatchLogs(),
      logGroupName: config.logGroupName,
      logStreamName: config.logStreamName,
    }),
  )
}

export default logger
