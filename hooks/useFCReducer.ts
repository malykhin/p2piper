import { useReducer } from 'react'

function filesCatalogReducer(state, action) {
  switch (action.type) {
    case 'CREATE_FILE':
      const file = action.payload
      file.isCompleted = false
      file.nChunksReceived = 0
      return [...state, file]

    case 'UPDATE_FILE':
      const newState = [...state]
      const chunk = action.payload
      const itemIndex = newState.findIndex((it) => it.id === chunk.fileId)
      const item = { ...newState[itemIndex] }

      item.nChunksReceived += 1
      if (item.nChunksReceived === item.nChunks) {
        item.isCompleted = true
      }
      newState[itemIndex] = item
      return newState
    default:
      return state
  }
}

export function useFCReducer() {
  const [filesCatalog, filesCatalogDispatch] = useReducer(filesCatalogReducer, [])

  return { filesCatalog, filesCatalogDispatch }
}
