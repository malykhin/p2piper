import FileInput from './FileInput'

import styles from '../styles/FileManager.module.scss'

export default function FileManager({ isVisible, disabled, handleFileCreate }) {
  if (!isVisible) {
    return null
  }
  return (
    <div className={styles.wrapper}>
      <FileInput disabled={disabled} handleChange={handleFileCreate} />
    </div>
  )
}
