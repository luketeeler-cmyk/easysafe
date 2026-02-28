import { useState, useEffect } from 'react'
import { useMagazinesStore } from '../../../stores/magazinesStore'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { Spinner } from '../../../components/ui/Spinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { toast } from '../../../components/ui/Toast'
import type { Magazine } from '../../../types'
import styles from './MagazinesTab.module.css'

interface MagazinesTabProps {
  firearmId: string
}

const emptyForm = { manufacturer: '', capacity: '', quantity: '1', notes: '' }

export function MagazinesTab({ firearmId }: MagazinesTabProps) {
  const { magazines, loading, fetchMagazines, addMagazine, updateMagazine, removeMagazine } = useMagazinesStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchMagazines(firearmId) }, [firearmId, fetchMagazines])

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!form.capacity) { toast.error('Capacity is required'); return }
    setSaving(true)
    const data = {
      firearm_id: firearmId,
      manufacturer: form.manufacturer || null,
      capacity: parseInt(form.capacity) || 0,
      quantity: parseInt(form.quantity) || 1,
      notes: form.notes || null,
    }
    if (editingId) {
      const { error } = await updateMagazine(editingId, data)
      if (error) toast.error(error); else toast.success('Magazine updated')
    } else {
      const { error } = await addMagazine(data)
      if (error) toast.error(error); else toast.success('Magazine added')
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleEdit = (mag: Magazine) => {
    setForm({
      manufacturer: mag.manufacturer || '',
      capacity: String(mag.capacity || ''),
      quantity: String(mag.quantity || 1),
      notes: mag.notes || '',
    })
    setEditingId(mag.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this magazine?')) return
    const { error } = await removeMagazine(id)
    if (error) toast.error(error); else toast.success('Magazine deleted')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  if (loading) return <Spinner size={24} />

  const totalMags = magazines.reduce((sum, m) => sum + (m.quantity || 1), 0)

  return (
    <div className={styles.container}>
      <div className={styles.summary}>{totalMags} magazine{totalMags !== 1 ? 's' : ''} total</div>

      {!showForm && (
        <div className={styles.addBtn}>
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>+ Add Magazine</Button>
        </div>
      )}

      {showForm && (
        <div className={styles.form}>
          <div className={styles.formGrid}>
            <Input label="Manufacturer" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g., Magpul, OEM" />
            <Input label="Capacity *" type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g., 15" />
            <Input label="Quantity" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} min="1" />
            <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
          <div className={styles.formActions}>
            <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSave}>{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      )}

      {magazines.length === 0 && !showForm ? (
        <EmptyState title="No magazines tracked" description="Add external magazines for this firearm." />
      ) : (
        <div className={styles.list}>
          {magazines.map(mag => (
            <div key={mag.id} className={styles.item}>
              <div className={styles.itemInfo}>
                {mag.manufacturer && (
                  <div className={styles.itemField}><div className={styles.itemLabel}>Manufacturer</div>{mag.manufacturer}</div>
                )}
                <div className={styles.itemField}><div className={styles.itemLabel}>Capacity</div>{mag.capacity} rd</div>
                <div className={styles.itemField}><div className={styles.itemLabel}>Qty</div>{mag.quantity}</div>
                {mag.notes && <div className={styles.itemField}><div className={styles.itemLabel}>Notes</div>{mag.notes}</div>}
              </div>
              <div className={styles.itemActions}>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(mag)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(mag.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
