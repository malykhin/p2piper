import styles from '../styles/FileList.module.scss'

function FileList({ filesCatalog, download }) {
  return (
    <table>
      <tbody>
        {filesCatalog.map((f) => (
          <tr key={f.id}>
            <td>
              <button disabled={f.nChunksReceived < f.nChunks} onClick={() => download(f)}>
                {f.name}
              </button>
            </td>
            <td>
              <progress value={f.nChunksReceived} max={f.nChunks} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default FileList
