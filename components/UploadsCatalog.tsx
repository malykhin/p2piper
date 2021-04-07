import Progress from './Progress'
import styles from '../styles/UploadsCatalog.module.scss'

interface IUploadsCatalog {
  data: Array<any>
  isVisible: boolean
}

function DoneIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="16" fill="#8CF1C7" />
      <path
        d="M13.3896 21.3335L9 16.4382L11.5526 14.7158L13.631 17.0338L20.8629 10.3335L23 12.5342L13.3896 21.3335Z"
        fill="#3FA990"
      />
    </svg>
  )
}

export default function UploadsCatalog({ isVisible, data }: IUploadsCatalog) {
  if (!isVisible) {
    return null
  }

  return (
    <>
      {data.map((f) => {
        const isCompleted = f.processed === f.nChunks
        return (
          <div key={f.id} className={styles.item}>
            <div className={styles.row}>
              <span className={styles.fileName}>{f.name}</span>
              {isCompleted && <DoneIcon />}
            </div>
            {!isCompleted && <Progress current={f.processed} total={f.nChunks} />}
          </div>
        )
      })}
    </>
  )
}
