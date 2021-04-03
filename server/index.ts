import { createServer } from 'http'
import next from 'next'

import { createAdapter } from 'socket.io-redis'
import { RedisClient, ClientOpts } from 'redis'
import { Server, Socket } from 'socket.io'

import Offer from './OfferRepository'

import config from './config'
import logger from './logger'

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const errorLoggerCatcher = (error) => {
  logger.info('error', error)
  throw error
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl: any = new URL(req.url, 'http://w.w')

    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: config.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  const offer = new Offer(config.redisHost, config.redisPort, config.useTLS)

  const redisOptions: ClientOpts = {
    host: config.redisHost,
    port: config.redisPort,
  }

  if (config.useTLS) {
    redisOptions.tls = {}
  }

  const pubClient = new RedisClient(redisOptions)
  const subClient = pubClient.duplicate()

  io.adapter(createAdapter({ pubClient, subClient }))
  io.on('connection', async (socket: Socket) => {
    socket.on('error', (error) => logger.info(error))

    const sessionId = socket.handshake.auth.sessionId
    const token = socket.handshake.auth.token

    logger.info(`connection_${sessionId}_${token}`)
    const isTokenExist = await offer.has(token).catch(errorLoggerCatcher)
    logger.info(`isTokenExist_${sessionId}_${token}_${isTokenExist}`)

    if (token && isTokenExist) {
      const o = await offer.get(token).catch(errorLoggerCatcher)
      logger.info('offer_on_connection', o)
      socket.emit('candidate', o)
      socket.join(token)

      socket.on('answer', (answer) => {
        logger.info(`answer_${sessionId}_${token}`)
        answer.senderId = sessionId
        socket.to(token).emit('candidate', answer)
      })
      socket.on('candidate', (candidate) => {
        logger.info(`candidate_${sessionId}_${token}`)
        candidate.senderId = token
        socket.to(token).emit('candidate', candidate)
      })
    } else {
      logger.info(`session_${sessionId}`)

      socket.join(sessionId)

      socket.on('set_offer', (o) => {
        logger.info(`set_offer_${sessionId}`)
        offer.set(sessionId, o)
      })

      socket.on('candidate', (candidate) => {
        logger.info(`candidate_wo_token_${sessionId}`)
        candidate.senderId = sessionId
        socket.to(sessionId).emit('candidate', candidate)
      })
    }
  })

  httpServer.listen(port, () => {
    logger.info(`Ready on port:${port}`)
  })
})
