import { useRef } from 'react'

import SheetsLogo from './SheetsLogo'

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

  const preventTabOpen = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleChange({
      ...e,
      target: {
        ...e.target,
        files: e.dataTransfer.files,
      },
    })
  }

  return (
    <label
      onDragOver={preventTabOpen}
      onDrop={handleDrop}
      className={[styles.label, disabled && styles.disabled].join(' ')}
    >
      <SheetsLogo />
      <h3>Upload your document</h3>
      <h4>
        Drag &amp; drop or <span>browse</span> your file here
      </h4>
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
