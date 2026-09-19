export function readUploadFile(file) {
  if (!file) return Promise.reject(new Error('파일을 선택하세요.'))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result || '')
      if (!content.trim()) {
        reject(new Error('빈 파일이거나 텍스트로 읽을 수 없습니다.'))
        return
      }
      resolve({ name: file.name, content })
    }
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'))
    reader.readAsText(file)
  })
}

export function FileDropZone({ disabled, onFile, label = '파일을 드래그하거나 클릭해서 업로드' }) {
  function handleFiles(list) {
    const file = list?.[0]
    if (!file || disabled) return
    onFile(file)
  }

  return (
    <label
      className={`nlm-dropzone${disabled ? ' is-disabled' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDrop={(event) => {
        event.preventDefault()
        if (disabled) return
        handleFiles(event.dataTransfer.files)
      }}
    >
      <input
        type="file"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <span>{label}</span>
    </label>
  )
}
