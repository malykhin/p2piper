import log from './logger'

type GTagEvent = {
  action: string
  category: string
  label: string
  value: number
}

let GA_TRACKING_ID = ''

export const setTrackingId = (trackingId: string) => {
  GA_TRACKING_ID = trackingId
}

export const pageView = (url: URL) => {
  if (GA_TRACKING_ID) {
    ;(window as any).gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  } else {
    log('pageView', url)
  }
}

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (GA_TRACKING_ID) {
    ;(window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  } else {
    log('analyticsEvent', { action, category, label, value })
  }
}

export const peerConnectedEvent = () =>
  event({
    action: 'peerConnected',
    category: 'userActions',
    label: 'userActions',
    value: 1,
  })

export const receiveFileEvent = () =>
  event({
    action: 'receiveFile',
    category: 'userActions',
    label: 'userActions',
    value: 1,
  })

export const uploadFileEvent = (fileSize: number = 0) =>
  event({
    action: 'uploadFile',
    category: 'userActions',
    label: 'fileSize',
    value: fileSize,
  })
