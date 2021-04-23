import Head from 'next/head'
import dynamic from 'next/dynamic'

import Invite from '../components/Invite'
import GitHubLogo from '../components/GitHubLogo'

import useWebRtc from '../hooks/useWebRtc'
import { getSessionId } from '../utils/token'

import styles from '../styles/Home.module.scss'

const FileList = dynamic(() => import('../components/FileList'))
const TextBox = dynamic(() => import('../components/TextBox'))
const FileManager = dynamic(() => import('../components/FileManager'))
const UploadsCatalog = dynamic(() => import('../components/UploadsCatalog'))
const AttachmentLogo = dynamic(() => import('../components/AttachmentLogo'))

const BASE_URL = process.env.BASE_URL
const GA_TRACKING_ID = process.env.GA_TRACKING_ID

export default function Home({ sessionId, baseUrl, gaTrackingId, token }) {
  const {
    urlToJoin,
    isSecondary,
    isPeerConnected,
    handleTextChange,
    handleFileCreate,
    textValue,
    filesCatalog,
    download,
    uploads,
  } = useWebRtc(baseUrl, sessionId, gaTrackingId, token)

  const isInviteVisible = !isSecondary && !isPeerConnected
  const isTextBoxVisible = isPeerConnected || !!textValue
  const isFileManagerVisible = isPeerConnected || !!filesCatalog.length
  const isUploadsVisible = !!uploads.length
  const isCardVisible = isFileManagerVisible || isTextBoxVisible || isUploadsVisible
  return (
    <div className={styles.container}>
      <Head>
        <title>P2Piper</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="Description" content="Application for sending files between browsers. Desktop and mobile."></meta>
      </Head>
      <main className={styles.main}>
        {isInviteVisible && <Invite url={urlToJoin} />}

        {isCardVisible && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHeading}>
                <AttachmentLogo />
                Upload the attachment
              </div>
              <div className={styles.internal}>
                <FileManager
                  isVisible={isFileManagerVisible}
                  disabled={!isPeerConnected}
                  handleFileCreate={handleFileCreate}
                />
                <TextBox
                  isVisible={isTextBoxVisible}
                  disabled={!isPeerConnected}
                  value={textValue}
                  handleChange={handleTextChange}
                />
              </div>
              <FileList filesCatalog={filesCatalog} download={download} />
              <UploadsCatalog isVisible={isUploadsVisible} data={uploads} />
            </div>
          </>
        )}
      </main>
      <footer className={styles.footer}>
        <a href="https://github.com/malykhin/p2piper" aria-label="GitHub" target="_blank" rel="noreferrer">
          <GitHubLogo />
        </a>
      </footer>
    </div>
  )
}

export async function getServerSideProps(context) {
  return {
    props: {
      sessionId: await getSessionId(),
      baseUrl: BASE_URL,
      gaTrackingId: GA_TRACKING_ID,
      token: (context?.resolvedUrl ?? '').replace('/', '').replace('?t=', ''),
    },
  }
}
