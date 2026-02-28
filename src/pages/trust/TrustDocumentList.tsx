import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrustDocumentsStore } from '../../stores/trustDocumentsStore'
import * as trustDocumentService from '../../services/trustDocumentService'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { toast } from '../../components/ui/Toast'
import styles from './TrustDocumentList.module.css'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TrustDocumentList() {
  const navigate = useNavigate()
  const { documents, loading, fetchDocuments, removeDocument } = useTrustDocumentsStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleView = async (filePath: string) => {
    const { data, error } = await trustDocumentService.getDocumentUrl(filePath)
    if (error || !data) {
      toast.error('Could not open document')
    } else {
      window.open(data, '_blank')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const doc = documents.find(d => d.id === deleteId)
    const { error } = await removeDocument(deleteId)
    if (error) {
      toast.error(error)
    } else {
      // Also delete from storage
      if (doc?.file_path) {
        await trustDocumentService.deleteDocumentFile(doc.file_path)
      }
      toast.success('Document deleted')
    }
    setDeleting(false)
    setDeleteId(null)
  }

  if (loading) {
    return <div className={styles.loading}><Spinner size={32} /></div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Trust Documents</h1>
        <Button onClick={() => navigate('/trust-documents/new')}>Upload Document</Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="No trust documents"
          description="Upload your NFA trust and legal documents here for safekeeping."
          action={<Button variant="secondary" onClick={() => navigate('/trust-documents/new')}>Upload Document</Button>}
        />
      ) : (
        <div className={styles.list}>
          {documents.map(doc => (
            <div key={doc.id} className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName}>{doc.name}</div>
                <div className={styles.cardMeta}>
                  {doc.upload_date && (
                    <span>Uploaded {new Date(doc.upload_date).toLocaleDateString()}</span>
                  )}
                  {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                  {doc.file_type && <span>{doc.file_type}</span>}
                </div>
                {doc.notes && <div className={styles.cardNotes}>{doc.notes}</div>}
              </div>
              <div className={styles.cardActions}>
                <Button variant="secondary" size="sm" onClick={() => handleView(doc.file_path)}>
                  View
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteId(doc.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this document? This cannot be undone.</p>
      </Modal>
    </div>
  )
}
