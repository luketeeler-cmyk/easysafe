import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as ammunitionService from '../../../services/ammunitionService'
import { Spinner } from '../../../components/ui/Spinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import type { Ammunition } from '../../../types'
import styles from './AvailableAmmoTab.module.css'

interface AvailableAmmoTabProps {
  caliber: string | null
}

export function AvailableAmmoTab({ caliber }: AvailableAmmoTabProps) {
  const [ammo, setAmmo] = useState<Ammunition[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!caliber) return
    setLoading(true)
    ammunitionService
      .getAmmunitionByCaliber(caliber)
      .then(({ data }) => {
        if (data) setAmmo(data)
      })
      .finally(() => setLoading(false))
  }, [caliber])

  if (!caliber) {
    return (
      <EmptyState
        title="No caliber set"
        description="Set a caliber on this firearm to see matching ammunition from your inventory."
      />
    )
  }

  if (loading) return <Spinner size={24} />

  if (ammo.length === 0) {
    return (
      <div className={styles.container}>
        <EmptyState
          title={`No ${caliber} ammunition`}
          description={`You don't have any ammunition matching "${caliber}" in your inventory.`}
          action={
            <Link to="/ammunition/new" className={styles.addLink}>
              + Add Ammunition
            </Link>
          }
        />
      </div>
    )
  }

  const totalRounds = ammo.reduce((sum, a) => sum + (a.quantity || 0), 0)

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        {ammo.length} entr{ammo.length !== 1 ? 'ies' : 'y'} · {totalRounds.toLocaleString()} rounds
        of {caliber}
      </div>

      <div className={styles.list}>
        {ammo.map((a) => (
          <Link to={`/ammunition/${a.id}`} key={a.id} className={styles.item}>
            <div className={styles.itemMain}>
              <span className={styles.manufacturer}>{a.manufacturer || 'Unknown'}</span>
              {a.bullet_type && <span className={styles.bulletType}>{a.bullet_type}</span>}
              {a.grain && <span className={styles.grain}>{a.grain}gr</span>}
            </div>
            <div className={styles.itemRight}>
              <span className={styles.quantity}>{a.quantity.toLocaleString()} rds</span>
              {a.price != null && a.price > 0 && (
                <span className={styles.price}>${a.price.toFixed(2)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        <Link to="/ammunition" className={styles.manageLink}>
          Manage ammunition inventory →
        </Link>
      </div>
    </div>
  )
}
