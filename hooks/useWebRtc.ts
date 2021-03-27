import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { saveAs } from 'file-saver'

import SignalingChannel from '../utils/SignallingChannel'
import FileStorage from '../utils/FileStorage'
import { useFCReducer } from './useFCReducer'
import log from '../utils/logger'

const MAX_CHUNK_SIZE = 10 * 1024

const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ],
}

export default function useWebRtc(basePath: string, sessionId: string) {
  const [isSecondary, setIsSecondary] = useState<boolean>(true)

  const [reload, toggleReload] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false)
  const [isPeerDisconnected, setIsPeerDisconnected] = useState<boolean>(false)
  const [isAPIConnected, setIsAPIConnected] = useState<boolean>(false)

  const [isDownstreamConnected, setIsDownstreamConnected] = useState<boolean>(false)
  const [isUpstreamConnected, setIsUpstreamConnected] = useState<boolean>(false)

  const [error, setError] = useState<Error | null>(null)

  const dataChannel = useRef<RTCDataChannel>()
  const makingOffer = useRef<boolean>(false)
  const ignoreOffer = useRef<boolean>(false)
  const isSettingRemoteAnswerPending = useRef<boolean>(false)
  const debounceTimerId = useRef<NodeJS.Timeout>()
  const [textValue, setTextValue] = useState<string>('')

  const { filesCatalog, filesCatalogDispatch } = useFCReducer()
  const fileStorage = useRef(new FileStorage())

  useEffect(() => {
    filesCatalog.forEach((f) => {
      if (f.isCompleted) {
        fileStorage.current.forge(f.id, f.type)
      }
    })
    fileStorage.current
  }, [filesCatalog])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const token = searchParams.get('t')
    const isSecondary = !!token

    setIsSecondary(isSecondary)

    const signaling = new SignalingChannel(
      basePath,
      sessionId,
      token,
      () => {
        log('connected', sessionId, token)
        setIsAPIConnected(true)
      },
      () => {
        log('disconnected', sessionId, token)
        setIsAPIConnected(false)
      },
    )

    const pc = new RTCPeerConnection(configuration)

    pc.onicecandidate = ({ candidate }) => {
      log('onicecandidate', candidate)
      if (candidate) {
        signaling.send('candidate', { candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      const isConnected = pc.iceConnectionState === 'connected'
      const isDisconnected = pc.iceConnectionState === 'disconnected'
      setIsPeerConnected(isConnected)
      setIsPeerDisconnected(isDisconnected)

      if (isDisconnected) {
        pc.close()
        toggleReload(!reload)
      }
    }

    pc.onnegotiationneeded = async () => {
      if (isSecondary) {
        signaling.send('get_offer')
        return
      }
      try {
        makingOffer.current = true
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        signaling.send('set_offer', { description: pc.localDescription })
      } catch (error) {
        log(error)
        setError(error)
      } finally {
        makingOffer.current = false
        setError(null)
      }
    }

    signaling.addHandler('candidate', async ({ description, candidate }) => {
      try {
        if (pc.signalingState === 'closed') {
          return
        }
        if (description) {
          const isStable =
            pc.signalingState === 'stable' ||
            (pc.signalingState === 'have-local-offer' && isSettingRemoteAnswerPending.current)

          const ignore = description.type === 'offer' && false && (makingOffer.current || !isStable)
          ignoreOffer.current = ignore
          if (ignore) {
            return
          }
          isSettingRemoteAnswerPending.current = description.type === 'answer'
          await pc.setRemoteDescription(description)
          isSettingRemoteAnswerPending.current = false
          if (description.type === 'offer') {
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            signaling.send('answer', { description: pc.localDescription })
          }
        } else if (candidate) {
          try {
            await pc.addIceCandidate(candidate)
          } catch (error) {
            if (!ignoreOffer.current) {
              log(error)
              setError(error)
            }
          }
        }
      } catch (error) {
        log(error)
        setError(error)
      }
    })

    const handleDownStreamMessage = (message: string) => {
      const data = JSON.parse(message)
      if (data.type === 'SET_TEXT') {
        setTextValue(data.payload)
      }
      if (data.type === 'CREATE_FILE') {
        filesCatalogDispatch(data)
      }
      if (data.type === 'UPDATE_FILE') {
        filesCatalogDispatch(data)
        fileStorage.current.put(data.payload.fileId, data.payload.chunkId, data.payload.data)
      }
    }

    pc.ondatachannel = (e: RTCDataChannelEvent) => {
      const receiveChannel = e.channel
      receiveChannel.onmessage = (e: MessageEvent) => handleDownStreamMessage(e.data)
      receiveChannel.onopen = () => setIsDownstreamConnected(true)
      receiveChannel.onclose = () => setIsDownstreamConnected(false)
      receiveChannel.onerror = log
    }

    const dc = pc.createDataChannel('data', {
      ordered: false,
      maxRetransmits: 10,
    })

    dc.onclose = () => setIsUpstreamConnected(false)
    dc.onopen = () => setIsUpstreamConnected(true)
    dc.onerror = log

    dataChannel.current = dc
  }, [basePath, reload])

  const sendMessage = async (message: any) => {
    const sendChannel = dataChannel?.current
    if (!sendChannel || sendChannel.readyState !== 'open') {
      return
    }
    if (sendChannel.bufferedAmount > 10000000) {
      await new Promise((resolve) => setTimeout(resolve, 0))
      sendMessage(message)
    } else {
      sendChannel.send(message)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e?.target?.value
    setTextValue(value)
    if (debounceTimerId.current) {
      clearTimeout(debounceTimerId.current)
    }
    debounceTimerId.current = setTimeout(() => {
      const data = {
        type: 'SET_TEXT',
        payload: value,
      }
      sendMessage(JSON.stringify(data))
    }, 300)
  }

  const handleFileCreate = (e) => {
    const file = e.target.files[0]
    const fileId = uuid()
    const { lastModified, lastModifiedDate, name, type } = file

    const nChunks = Math.ceil(file.size / MAX_CHUNK_SIZE)

    let offset = 0

    const data = {
      type: 'CREATE_FILE',
      payload: { id: fileId, nChunks, lastModified, lastModifiedDate, name, type },
    }
    sendMessage(JSON.stringify(data))

    const readEventHandler = (i) => (e) => {
      if (e.target.error == null) {
        offset += e.target.result.byteLength
        const data = {
          type: 'UPDATE_FILE',
          payload: {
            fileId,
            chunkId: i,
            data: btoa(
              Array.from(new Uint8Array(e.target.result))
                .map((c) => String.fromCharCode(c))
                .join(''),
            ),
          },
        }
        if (e.target.result.byteLength) {
          sendMessage(JSON.stringify(data))
          chunkReaderBlock(offset, MAX_CHUNK_SIZE, file, i + 1)
        }
      }
    }

    const chunkReaderBlock = (offset, length, file, i) => {
      const r = new FileReader()
      const blob = file.slice(offset, length + offset)

      r.onload = readEventHandler(i)
      r.readAsArrayBuffer(blob)
    }

    chunkReaderBlock(offset, MAX_CHUNK_SIZE, file, 0)
  }

  const urlToJoin = useMemo(() => (sessionId ? `${basePath}?t=${sessionId}` : ''), [basePath, sessionId])

  const download = useCallback(
    (f) => {
      saveAs(fileStorage.current.get(f.id), f.name)
    },
    [fileStorage],
  )

  return {
    sessionId,
    isSecondary,
    urlToJoin,
    isPeerConnected,
    isPeerDisconnected,
    isAPIConnected,
    isDownstreamConnected,
    isUpstreamConnected,
    error,
    isLoading,
    sendMessage,
    handleTextChange,
    textValue,
    handleFileCreate,
    filesCatalog,
    download,
  }
}
