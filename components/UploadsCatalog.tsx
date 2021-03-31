interface IUploadsCatalog {
  data: Array<any>
}

export default function UploadsCatalog({ data }: IUploadsCatalog) {
  return (
    <table>
      <tbody>
        {data.map((f) => (
          <tr key={f.id}>
            <td>{f.name}</td>
            <td>
              <progress value={f.processed} max={f.nChunks} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
