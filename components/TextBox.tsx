import styles from '../styles/TextBox.module.scss'

interface ITexBox {
  value: string
  disabled: boolean
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

function TexBox({ disabled, value, handleChange }: ITexBox) {
  return (
    <label className={styles.label}>
      Enter the text:
      <textarea className={styles.textarea} disabled={disabled} value={value} onChange={handleChange} />
    </label>
  )
}

export default TexBox
