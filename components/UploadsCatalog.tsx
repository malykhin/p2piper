import styles from '../styles/UploadsCatalog.module.scss'

interface IUploadsCatalog {
  data: Array<any>
  isVisible: boolean
}

export default function UploadsCatalog({ isVisible, data }: IUploadsCatalog) {
  if (!isVisible) {
    return null
  }
  return (
    <table>
      <tbody>
        {data.map((f) => (
          <tr key={f.id}>
            <td className={styles.cell}>{f.name}</td>
            <td>
              <progress value={f.processed} max={f.nChunks} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
