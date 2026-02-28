import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import * as suppressorService from '../../services/suppressorService'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { PhotoGrid } from '../../components/ui/PhotoGrid'
import { Lightbox } from '../../components/ui/Lightbox'
import { SubTabNav } from '../../components/ui/SubTabNav'
import { toast } from '../../components/ui/Toast'
import { PartsTab } from '../firearms/tabs/PartsTab'
import { RoundCountTab } from '../firearms/tabs/RoundCountTab'
import type { Suppressor } from '../../types'
import styles from './SuppressorDetail.module.css'

const STAMP_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  denied: 'danger',
}

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'parts', label: 'Parts & Attachments' },
  { key: 'rounds', label: 'Round Count' },
]

export function SuppressorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [suppressor, setSuppressor] = useState<Suppressor | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    suppressorService
      .getSuppressor(id)
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Suppressor not found')
          navigate('/suppressors')
        } else {
          setSuppressor(data)
        }
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    const { error } = await suppressorService.deleteSuppressor(id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Suppressor deleted')
      navigate('/suppressors')
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size={32} />
      </div>
    )
  }

  if (!suppressor) return null

  const photos = suppressor.photos || []

  return (
    <div className={styles.container}>
      <Link to="/suppressors" className={styles.backLink}>
        ← Back to Suppressors
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {suppressor.manufacturer} {suppressor.model}
          </h1>
          {suppressor.serial && (
            <span className={styles.serial}>S/N: {suppressor.serial}</span>
          )}
        </div>
        <div className={styles.headerActions}>
          <Link to={`/suppressors/${id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      {photos.length > 0 && (
        <div className={styles.photos}>
          <PhotoGrid photos={photos} onPhotoClick={setLightboxIndex} />
        </div>
      )}

      <SubTabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={styles.tabContent}>
        {activeTab === 'details' && (
          <div className={styles.infoGrid}>
            {suppressor.calibers_rated && suppressor.calibers_rated.length > 0 && (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Calibers Rated</div>
                <div className={styles.caliberList}>
                  {suppressor.calibers_rated.map((c) => (
                    <Badge key={c}>{c}</Badge>
                  ))}
                </div>
              </div>
            )}
            {suppressor.length && (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Length</div>
                <div className={styles.fieldValue}>{suppressor.length}</div>
              </div>
            )}
            {suppressor.diameter && (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Diameter</div>
                <div className={styles.fieldValue}>{suppressor.diameter}</div>
              </div>
            )}
            {suppressor.weight && (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Weight</div>
                <div className={styles.fieldValue}>{suppressor.weight}</div>
              </div>
            )}
            {suppressor.mount_type && (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Mount Type</div>
                <div className={styles.fieldValue}>{suppressor.mount_type}</div>
              </div>
            )}

            {(suppressor.form4_date ||
              suppressor.tax_stamp_status ||
              suppressor.trust_name) && (
              <div className={styles.nfaSection}>
                <h3 className={styles.sectionTitle}>NFA Information</h3>
                <div className={styles.nfaGrid}>
                  {suppressor.tax_stamp_status && (
                    <div className={styles.field}>
                      <div className={styles.fieldLabel}>Tax Stamp</div>
                      <Badge
                        variant={
                          STAMP_VARIANT[suppressor.tax_stamp_status] || 'default'
                        }
                      >
                        {suppressor.tax_stamp_status}
                      </Badge>
                    </div>
                  )}
                  {suppressor.form4_date && (
                    <div className={styles.field}>
                      <div className={styles.fieldLabel}>Form 4 Date</div>
                      <div className={styles.fieldValue}>
                        {new Date(suppressor.form4_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {suppressor.trust_name && (
                    <div className={styles.field}>
                      <div className={styles.fieldLabel}>Trust Name</div>
                      <div className={styles.fieldValue}>{suppressor.trust_name}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {suppressor.purchase_date && (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Purchase Date</div>
                <div className={styles.fieldValue}>
                  {new Date(suppressor.purchase_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {suppressor.price != null && suppressor.price > 0 && (
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Price</div>
                <div className={styles.fieldValue}>
                  ${Number(suppressor.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
            {suppressor.notes && (
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.fieldLabel}>Notes</div>
                <div className={styles.fieldValue}>{suppressor.notes}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'parts' && (
          <PartsTab parentType="suppressor" parentId={id!} />
        )}

        {activeTab === 'rounds' && (
          <RoundCountTab parentType="suppressor" parentId={id!} />
        )}
      </div>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Suppressor"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>
            {suppressor.manufacturer} {suppressor.model}
          </strong>
          ? This cannot be undone.
        </p>
      </Modal>

      <Lightbox
        photos={photos}
        currentIndex={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  )
}
