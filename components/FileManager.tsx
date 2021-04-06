import FileInput from './FileInput'
import FileList from './FileList'

import styles from '../styles/FileManager.module.scss'

export default function FileManager({ isVisible, disabled, handleFileCreate, filesCatalog, download }) {
  if (!isVisible) {
    return null
  }
  return (
    <div className={styles.wrapper}>
      <FileInput disabled={disabled} handleChange={handleFileCreate} />
      <FileList filesCatalog={filesCatalog} download={download} />
    </div>
  )
}
