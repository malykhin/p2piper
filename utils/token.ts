import { randomBytes } from 'crypto'
import { promisify } from 'util'

export const getSessionId = () => promisify(randomBytes)(8).then((d) => d.toString('hex'))
