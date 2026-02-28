import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrustDocumentsStore } from '../../stores/trustDocumentsStore'
import * as trustDocumentService from '../../services/trustDocumentService'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { toast } from '../../components/ui/Toast'
import styles from './TrustDocumentForm.module.css'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TrustDocumentForm() {
  const navigate = useNavigate()
  const { addDocument } = useTrustDocumentsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(f.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50MB')
      return
    }
    setFile(f)
    if (!name) {
      setName(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [name])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Document name is required'); return }
    if (!file) { toast.error('Please select a file'); return }

    setSaving(true)
    try {
      const { data: filePath, error: uploadError } = await trustDocumentService.uploadDocument(file)
      if (uploadError || !filePath) {
        toast.error(uploadError || 'Upload failed')
        setSaving(false)
        return
      }

      const { error } = await addDocument({
        name: name.trim(),
        notes: notes.trim() || null,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        upload_date: new Date().toISOString().split('T')[0],
      })

      if (error) {
        toast.error(error)
      } else {
        toast.success('Document uploaded')
        navigate('/trust-documents')
      }
    } catch {
      toast.error('An unexpected error occurred')
    }
    setSaving(false)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Upload Document</h1>

      <div className={styles.form}>
        <Input
          label="Document Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Smith Family NFA Trust"
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this document..."
          rows={3}
        />

        <div className={styles.fieldLabel}>File *</div>
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${file ? styles.dropZoneHasFile : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className={styles.filePreview}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>{formatSize(file.size)}</div>
              </div>
              <button
                className={styles.removeFile}
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                type="button"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className={styles.dropZoneContent}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="12" />
                <line x1="15" y1="15" x2="12" y2="12" />
              </svg>
              <div className={styles.dropZoneText}>
                Drop a PDF or image here, or click to browse
              </div>
              <div className={styles.dropZoneHint}>PDF, JPG, PNG — max 50MB</div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />

        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/trust-documents')}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Upload Document
          </Button>
        </div>
      </div>
    </div>
  )
}
