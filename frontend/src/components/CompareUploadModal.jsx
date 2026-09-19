import { useState } from 'react'
import { FileDropZone, readUploadFile } from './FileDropZone'

export default function CompareUploadModal({ parentTitle, busy, error, onClose, onSubmit }) {
  const [localError, setLocalError] = useState('')

  async function handleFile(file) {
    setLocalError('')
    try {
      const parsed = await readUploadFile(file)
      await onSubmit(parsed)
    } catch (err) {
      setLocalError(err.message || '업로드에 실패했습니다.')
    }
  }

  return (
    <div className="nlm-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="nlm-modal" role="dialog" aria-labelledby="compare-upload-title" onClick={(event) => event.stopPropagation()}>
        <div className="nlm-modal-head">
          <h2 id="compare-upload-title">비교하기</h2>
          <button type="button" className="nlm-ghost" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="nlm-modal-copy">
          {parentTitle ? `'${parentTitle}' 노드와 비교할 파일을 업로드하세요.` : '비교할 파일을 업로드하세요.'}
          노드를 만든 사람이 아니어도 업로드할 수 있습니다.
        </p>
        <FileDropZone disabled={busy} onFile={handleFile} label={busy ? '비교 분석 중…' : '파일을 끌어다 놓거나 클릭'} />
        {localError || error ? <p className="nlm-error">{localError || error}</p> : null}
      </div>
    </div>
  )
}
