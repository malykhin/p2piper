import FileInput from './FileInput'
import FileList from './FileList'

import styles from '../styles/FileManager.module.scss'

export default function FileManager({ disabled, handleFileCreate, filesCatalog, download }) {
  return (
    <div className={styles.wrapper}>
      <label>Or select the file to send:</label>
      <FileInput disabled={disabled} handleChange={handleFileCreate} />
      <FileList filesCatalog={filesCatalog} download={download} />
    </div>
  )
}
