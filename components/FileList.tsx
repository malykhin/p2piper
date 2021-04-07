import Progress from './Progress'
import styles from '../styles/FileList.module.scss'

function FileList({ filesCatalog, download }) {
  return (
    <>
      {filesCatalog.map((f) => {
        const isCompleted = f.nChunksReceived === f.nChunks
        const _download = () => download(f)
        return (
          <div key={f.id} className={styles.item}>
            <div className={styles.row}>
              <span className={styles.fileName}>{f.name}</span>
              {isCompleted && (
                <button className={styles.download} disabled={!isCompleted} onClick={_download}>
                  Download
                </button>
              )}
            </div>
            {!isCompleted && <Progress current={f.nChunksReceived} total={f.nChunks} />}
          </div>
        )
      })}
    </>
  )
}

export default FileList
