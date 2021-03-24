import { useRef } from 'react'
import styles from '../styles/FileInput.module.scss'

interface IFileInput {
  handleChange: (e: any) => void
  disabled: boolean
}

function FileInput({ handleChange, disabled }: IFileInput) {
  const inputRef = useRef(null)

  const cleanup = () => {
    if (inputRef.current) {
      inputRef.current.value = null
    }
  }

  return (
    <label className={[styles.label, disabled && styles.disabled].join(' ')}>
      Load file
      <input
        disabled={disabled}
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        onChange={handleChange}
        onClick={cleanup}
      />
    </label>
  )
}

export default FileInput
