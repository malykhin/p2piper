import io from 'socket.io-client'

class SignallingChannel {
  socket: SocketIOClient.Socket
  onmessage: (data: any) => void = () => {}

  constructor(
    url: string,
    sessionId: string,
    token?: string | null,
    connectCb?: (data: any) => void,
    disconnectCb?: (data: any) => void,
  ) {
    const options: SocketIOClient.ConnectOpts = {
      autoConnect: true,
    }

    if (token) {
      options.auth = {
        token,
      }
    } else {
      options.auth = {
        sessionId,
      }
    }

    this.socket = io(url, options)

    this.socket.on('connect', connectCb ? connectCb : () => {})
    this.socket.on('disconnect', disconnectCb ? disconnectCb : () => {})
    this.socket.on('root_redirect', () => {
      window.location.search = ''
    })
  }

  addHandler(channel: string, cb: (data: any) => void) {
    this.socket.on(channel, cb)
  }

  removeHandler(channel: string, cb: (data: any) => void) {
    this.socket.off(channel, cb)
  }

  send(channel: string, msg?: any) {
    this.socket.emit(channel, msg)
  }

  close() {
    this.socket.close()
  }
}

export default SignallingChannel
