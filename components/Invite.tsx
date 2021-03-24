import { useRef, useLayoutEffect } from 'react'
import QRCode from 'qrcode'

import styles from '../styles/Invite.module.scss'

interface IInvite {
  url?: string
}
function Invite({ url }: IInvite) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    if (ref.current) {
      QRCode.toCanvas(ref.current, url ?? '')
    }
  }, [url])

  if (!url) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      <h2>Get started by scan QR code:</h2>
      <canvas ref={ref} />
      <h3>Or open the link:</h3>
      <a target="_blank" href={url}>
        {url}
      </a>
    </div>
  )
}

export default Invite
