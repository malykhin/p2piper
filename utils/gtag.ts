import log from './logger'

export const GA_TRACKING_ID = process.env.GA_TRACKING_ID

const isProd = process.env.APP_ENV === 'production'

log('isProd', isProd)

type GTagEvent = {
  action: string
  category: string
  label: string
  value: number
}

export const pageView = (url: URL) => {
  if (isProd) {
    ;(window as any).gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  } else {
    log('pageView', url)
  }
}

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (isProd) {
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
