import styles from '../styles/TextBox.module.scss'

interface ITexBox {
  value: string
  disabled: boolean
  isVisible: boolean
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

function TexBox({ isVisible, disabled, value, handleChange }: ITexBox) {
  if (!isVisible) {
    return null
  }
  return (
    <textarea
      className={styles.textarea}
      disabled={disabled}
      value={value}
      onChange={handleChange}
      placeholder="Write your message here..."
    />
  )
}

export default TexBox
