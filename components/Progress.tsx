import styles from '../styles/Progress.module.scss'

export default function Progress({ current, total }) {
  const getProgress = (current, total) => Math.round((current / total) * 100) + '%'
  return (
    <>
      <div className={styles.progressWrapper}>
        <div className={styles.progressBackground} />
        <div className={styles.progressBar} style={{ width: getProgress(current, total) }} />
      </div>
      <div className={[styles.row, styles.details].join(' ')}>
        Uploading <span>{getProgress(current, total)}</span>
      </div>
    </>
  )
}
