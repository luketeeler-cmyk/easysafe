import { useState, useEffect } from 'react'
import { usePartsStore } from '../../../stores/partsStore'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { Spinner } from '../../../components/ui/Spinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { toast } from '../../../components/ui/Toast'
import type { PartAttachment, PartCategory } from '../../../types'
import styles from './PartsTab.module.css'

interface PartsTabProps {
  parentType: 'firearm' | 'suppressor'
  parentId: string
}

const PART_CATEGORIES = [
  { value: '', label: 'Select type...' },
  { value: 'optic', label: 'Optic' },
  { value: 'light', label: 'Light' },
  { value: 'laser', label: 'Laser' },
  { value: 'grip', label: 'Grip' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'stock', label: 'Stock' },
  { value: 'handguard', label: 'Handguard' },
  { value: 'muzzle_device', label: 'Muzzle Device' },
  { value: 'rail', label: 'Rail' },
  { value: 'mount', label: 'Mount' },
  { value: 'sling', label: 'Sling' },
  { value: 'bipod', label: 'Bipod' },
  { value: 'other', label: 'Other' },
]

const emptyForm = { name: '', type_category: '', manufacturer: '', model: '', price: '', notes: '' }

export function PartsTab({ parentType, parentId }: PartsTabProps) {
  const { parts, loading, fetchParts, addPart, updatePart, removePart } = usePartsStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchParts(parentType, parentId) }, [parentType, parentId, fetchParts])

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSaving(true)
    const data = {
      parent_type: parentType,
      parent_id: parentId,
      name: form.name,
      type_category: (form.type_category || undefined) as PartCategory | undefined,
      manufacturer: form.manufacturer || null,
      model: form.model || null,
      price: form.price ? parseFloat(form.price) : null,
      notes: form.notes || null,
      photos: [],
    }
    if (editingId) {
      const { error } = await updatePart(editingId, data)
      if (error) toast.error(error); else toast.success('Part updated')
    } else {
      const { error } = await addPart(data)
      if (error) toast.error(error); else toast.success('Part added')
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleEdit = (part: PartAttachment) => {
    setForm({
      name: part.name,
      type_category: part.type_category || '',
      manufacturer: part.manufacturer || '',
      model: part.model || '',
      price: part.price ? String(part.price) : '',
      notes: part.notes || '',
    })
    setEditingId(part.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this part?')) return
    const { error } = await removePart(id)
    if (error) toast.error(error); else toast.success('Part deleted')
  }

  const handleCancel = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  if (loading) return <Spinner size={24} />

  const totalValue = parts.reduce((sum, p) => sum + (p.price || 0), 0)

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        {parts.length} part{parts.length !== 1 ? 's' : ''}
        {totalValue > 0 && ` · Total value: $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
      </div>

      {!showForm && (
        <div className={styles.addBtn}>
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>+ Add Part</Button>
        </div>
      )}

      {showForm && (
        <div className={styles.form}>
          <div className={styles.formGrid}>
            <Input label="Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Holosun 507C" />
            <Select label="Type / Category" value={form.type_category} onChange={e => set('type_category', e.target.value)} options={PART_CATEGORIES} />
            <Input label="Manufacturer" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} />
            <Input label="Model" value={form.model} onChange={e => set('model', e.target.value)} />
            <Input label="Price" type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
            <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
          <div className={styles.formActions}>
            <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSave}>{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      )}

      {parts.length === 0 && !showForm ? (
        <EmptyState title="No parts or attachments" description="Track optics, lights, grips, and other accessories." />
      ) : (
        <div className={styles.list}>
          {parts.map(part => (
            <div key={part.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <div className={styles.itemField}>
                  <strong>{part.name}</strong>
                  {part.type_category && <span className={styles.typeBadge}>{part.type_category.replace('_', ' ')}</span>}
                </div>
                {(part.manufacturer || part.model) && (
                  <div className={styles.itemField}>
                    <div className={styles.itemLabel}>Make / Model</div>
                    {[part.manufacturer, part.model].filter(Boolean).join(' ')}
                  </div>
                )}
                {part.price != null && part.price > 0 && (
                  <div className={styles.itemField}><div className={styles.itemLabel}>Price</div>${part.price.toFixed(2)}</div>
                )}
              </div>
              <div className={styles.itemActions}>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(part)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(part.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
