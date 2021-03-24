import { promisify } from 'util'
import redis, { RedisClient, ClientOpts } from 'redis'

import logger from './logger'

const EXPIRATION_SEC = 60 * 5

class OfferRepository {
  private offerStorage: RedisClient

  constructor(host: string, port: number, useTLS?: boolean) {
    const options: ClientOpts = { host, port }
    if (useTLS) {
      options.tls = {}
    }
    this.offerStorage = redis.createClient(options)
    this.offerStorage.on('error', (error) => {
      logger.error(error)
    })
  }

  private getHash(id: string) {
    return `offer:${id}`
  }

  async set(id: string, offer: object) {
    const data = JSON.stringify(offer)
    promisify(this.offerStorage.set).bind(this.offerStorage)(this.getHash(id), data)
    promisify(this.offerStorage.expire).bind(this.offerStorage)(this.getHash(id), EXPIRATION_SEC)
  }

  async get(id: string) {
    try {
      return JSON.parse((await promisify(this.offerStorage.get).bind(this.offerStorage)(this.getHash(id))) ?? '')
    } catch (error) {
      return null
    }
  }

  async has(id: string) {
    return !!(await promisify(this.offerStorage.get).bind(this.offerStorage)(this.getHash(id)))
  }
}

export default OfferRepository
