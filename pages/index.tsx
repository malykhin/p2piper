import Head from 'next/head'
import Invite from '../components/Invite'
import Loader from '../components/Loader'
import Error from '../components/Error'
import TextBox from '../components/TextBox'
import GitHubLogo from '../components/GitHubLogo'
import FileManager from '../components/FileManager'
import UploadsCatalog from '../components/UploadsCatalog'
import useWebRtc from '../hooks/useWebRtc'
import { getSessionId } from '../utils/token'

import styles from '../styles/Home.module.scss'

const BASE_URL = process.env.BASE_URL
const GA_TRACKING_ID = process.env.GA_TRACKING_ID

export default function Home({ sessionId, baseUrl, gaTrackingId, token }) {
  console.log(token)
  const {
    urlToJoin,
    isSecondary,
    isPeerConnected,
    isLoading,
    error,
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

  return (
    <div className={styles.container}>
      <Head>
        <title>P2Piper</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="Description" content="Application for sending files between browsers. Desktop and mobile."></meta>
      </Head>
      <main className={styles.main}>
        {error && <Error />}
        {isLoading && <Loader />}
        {isInviteVisible && <Invite url={urlToJoin} />}
        {isTextBoxVisible && <TextBox disabled={!isPeerConnected} value={textValue} handleChange={handleTextChange} />}
        {isFileManagerVisible && (
          <FileManager
            disabled={!isPeerConnected}
            handleFileCreate={handleFileCreate}
            filesCatalog={filesCatalog}
            download={download}
          />
        )}
        {isUploadsVisible && <UploadsCatalog data={uploads} />}
      </main>
      <footer className={styles.footer}>
        <a href="https://github.com/malykhin/p2piper" target="_blank" rel="noreferrer">
          <GitHubLogo />
        </a>
      </footer>
    </div>
  )
}

export async function getServerSideProps(context) {
  console.log('getServerSideProps', context)
  return {
    props: {
      sessionId: await getSessionId(),
      baseUrl: BASE_URL,
      gaTrackingId: GA_TRACKING_ID,
      token: (context?.resolvedUrl ?? '').replace('/', '').replace('?t=', ''),
    },
  }
}
