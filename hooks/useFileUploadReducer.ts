import { useReducer } from 'react'

function uploadsReducer(state, action) {
  switch (action.type) {
    case 'CREATE_UPLOAD':
      return [...state, action.payload]

    case 'UPDATE_UPLOAD':
      const newState = [...state]
      const upload = action.payload
      const itemIndex = newState.findIndex((it) => it.id === upload.id)
      const item = { ...newState[itemIndex] }
      item.processed += 1
      newState[itemIndex] = item
      return newState
    default:
      return state
  }
}

export function useFileUploadReducer() {
  const [uploads, uploadsDispatch] = useReducer(uploadsReducer, [])

  return { uploads, uploadsDispatch }
}
