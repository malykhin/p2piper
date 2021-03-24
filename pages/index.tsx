import Head from 'next/head'

import styles from '../styles/Home.module.scss'

import Invite from '../components/Invite'
import Loader from '../components/Loader'
import Error from '../components/Error'
import TextBox from '../components/TextBox'

import FileManager from '../components/FileManager'

import useWebRtc from '../hooks/useWebRtc'

import { getSessionId } from '../utils/token'

const BASE_URL = process.env.BASE_URL

export default function Home({ sessionId, baseUrl }) {
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
  } = useWebRtc(baseUrl, sessionId)

  const isInviteVisible = !isSecondary && !isPeerConnected
  const isTextBoxVisible = isPeerConnected || !!textValue
  const isFileManagerVisible = isPeerConnected || !!filesCatalog.length

  return (
    <div className={styles.container}>
      <Head>
        <title>P2Piper</title>
        <link rel="icon" href="/favicon.ico" />
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
      </main>
      <footer className={styles.footer}>
        <a href="https://github.com/github" target="_blank">
          <img
            src="https://github.githubassets.com/images/modules/site/icons/footer/github-mark.svg"
            height="20"
            alt="GitHub mark"
          />
        </a>
      </footer>
    </div>
  )
}

export async function getServerSideProps() {
  return {
    props: {
      sessionId: await getSessionId(),
      baseUrl: BASE_URL,
    },
  }
}
