import { useState, useEffect } from 'react'
import { useRoundCountsStore } from '../../../stores/roundCountsStore'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Spinner } from '../../../components/ui/Spinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { toast } from '../../../components/ui/Toast'
import styles from './RoundCountTab.module.css'

interface RoundCountTabProps {
  parentType: 'firearm' | 'suppressor'
  parentId: string
}

export function RoundCountTab({ parentType, parentId }: RoundCountTabProps) {
  const { roundCounts, totalCount, loading, fetchRoundCounts, addRoundCount, removeRoundCount } =
    useRoundCountsStore()
  const [showForm, setShowForm] = useState(false)
  const [count, setCount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRoundCounts(parentType, parentId)
  }, [parentType, parentId, fetchRoundCounts])

  const handleSave = async () => {
    const num = parseInt(count)
    if (!num || num <= 0) {
      toast.error('Enter a valid round count')
      return
    }
    setSaving(true)
    const { error } = await addRoundCount({
      parent_type: parentType,
      parent_id: parentId,
      count: num,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || null,
    })
    if (error) {
      toast.error(error)
    } else {
      toast.success('Rounds logged')
      setCount('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      setShowForm(false)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    const { error } = await removeRoundCount(id)
    if (error) toast.error(error)
    else toast.success('Entry deleted')
  }

  if (loading) return <Spinner size={24} />

  return (
    <div className={styles.container}>
      <div className={styles.totalBox}>
        <div className={styles.totalLabel}>Total Rounds</div>
        <div className={styles.totalValue}>{totalCount.toLocaleString()}</div>
      </div>

      {!showForm ? (
        <div className={styles.addBtn}>
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            + Log Rounds
          </Button>
        </div>
      ) : (
        <div className={styles.form}>
          <div className={styles.formRow}>
            <Input
              label="Round Count *"
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="e.g., 200"
              min="1"
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Range session, ammo type..."
            />
          </div>
          <div className={styles.formActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setCount('')
                setNotes('')
              }}
            >
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={handleSave}>
              Add Entry
            </Button>
          </div>
        </div>
      )}

      {roundCounts.length === 0 && !showForm ? (
        <EmptyState
          title="No round count entries"
          description="Log your range sessions to track total rounds fired."
        />
      ) : (
        <div className={styles.list}>
          {roundCounts.map((rc) => (
            <div key={rc.id} className={styles.entry}>
              <div className={styles.entryInfo}>
                <span className={styles.entryCount}>+{rc.count.toLocaleString()}</span>
                <span className={styles.entryDate}>
                  {new Date(rc.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {rc.notes && <span className={styles.entryNotes}>{rc.notes}</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(rc.id)}>
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
