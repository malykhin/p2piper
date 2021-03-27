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
    socket.on('error', (error) => logger.error(error))

    const sessionId = socket.handshake.auth.sessionId
    const token = socket.handshake.auth.token

    logger.info(`connection_${sessionId}_${token}`)
    if (token && (await offer.has(token))) {
      socket.emit('offer', await offer.get(token))
      socket.join(token)

      socket.on('get_offer', async () => {
        logger.info(`get_offer_${sessionId}_${token}`)
        const o = await offer.get(token)
        socket.emit('candidate', o)
      })

      socket.on('answer', (answer) => {
        logger.info(`answer_${sessionId}_${token}`)
        socket.to(token).emit('candidate', answer)
      })
      socket.on('candidate', (candidate) => {
        logger.info(`candidate_${sessionId}_${token}`)
        socket.to(token).emit('candidate', candidate)
      })
    } else {
      logger.info(`session_${sessionId}`)
      socket.emit('session', sessionId)

      socket.join(sessionId)

      socket.on('set_offer', (msg) => {
        logger.info(`set_offer_${sessionId}`)
        offer.set(sessionId, msg)
      })

      socket.on('candidate', (candidate) => {
        logger.info(`candidate_wo_token_${sessionId}`)
        socket.to(token).emit('candidate', candidate)
      })
    }
  })

  httpServer.listen(port, () => {
    logger.info(`Ready on port:${port}`)
  })
})
