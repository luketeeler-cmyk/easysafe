import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFirearmsStore } from '../../stores/firearmsStore';
import { useAmmunitionStore } from '../../stores/ammunitionStore';
import { useSuppressorsStore } from '../../stores/suppressorsStore';
import type { Firearm, FirearmCategory, Condition } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import styles from './Dashboard.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface RedditPost {
  id: string;
  title: string;
  link_flair_text: string | null;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  thumbnail: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmtCurrency = (val: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

const fmtNumber = (val: number): string =>
  new Intl.NumberFormat('en-US').format(val);

function timeAgo(utcSeconds: number): string {
  const now = Date.now() / 1000;
  const diff = now - utcSeconds;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

const CATEGORY_LABELS: Record<string, string> = {
  handgun: 'Handguns',
  rifle: 'Rifles',
  shotgun: 'Shotguns',
  nfa_firearm: 'NFA',
};

const CONDITION_LABELS: Record<Condition, string> = {
  new: 'New',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const CONDITION_VARS: Record<Condition, string> = {
  new: 'var(--cond-new)',
  excellent: 'var(--cond-excellent)',
  good: 'var(--cond-good)',
  fair: 'var(--cond-fair)',
  poor: 'var(--cond-poor)',
};

const CONDITIONS: Condition[] = ['new', 'excellent', 'good', 'fair', 'poor'];

/* ------------------------------------------------------------------ */
/*  r/gundeals Feed Hook                                                */
/* ------------------------------------------------------------------ */

function useGunDealsFeed() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/gundeals');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items: RedditPost[] = json.data.children.map(
        (c: { data: RedditPost }) => c.data,
      );
      setPosts(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return { posts, loading, error, refresh: fetchFeed };
}

/* ------------------------------------------------------------------ */
/*  SVG Icons (inline to avoid dependencies)                            */
/* ------------------------------------------------------------------ */

const IconFirearm = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h6l2-3h8l2 3h2" />
    <path d="M6 12v4h2l1-2h6l1 2h2v-4" />
    <circle cx="12" cy="8" r="1" />
  </svg>
);

const IconAmmo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="20" rx="2" />
    <path d="M8 8h8" />
    <path d="M10 2v6" />
    <path d="M14 2v6" />
  </svg>
);

const IconSuppressor = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="9" width="20" height="6" rx="3" />
    <path d="M7 9v6" />
    <path d="M12 9v6" />
    <path d="M17 9v6" />
  </svg>
);

const IconValue = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4l-8 8h5v8h6v-8h5z" />
  </svg>
);

const IconComment = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconExternal = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Skeleton Loaders                                                    */
/* ------------------------------------------------------------------ */

const SkeletonCard: React.FC = () => (
  <div className={styles.statCard}>
    <div className={`${styles.skeletonIcon} ${styles.skeleton}`} />
    <div className={`${styles.skeletonValue} ${styles.skeleton}`} />
    <div className={`${styles.skeletonLabel} ${styles.skeleton}`} />
  </div>
);

const SkeletonDealCard: React.FC = () => (
  <div className={styles.dealCard}>
    <div className={`${styles.skeletonTitle} ${styles.skeleton}`} />
    <div className={`${styles.skeletonMeta} ${styles.skeleton}`} />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Dashboard Component                                                 */
/* ------------------------------------------------------------------ */

const Dashboard: React.FC = () => {
  const { firearms, loading: firearmsLoading, fetchFirearms } = useFirearmsStore();
  const { ammunition, loading: ammoLoading, fetchAmmunition } = useAmmunitionStore();
  const { suppressors, loading: suppressorsLoading, fetchSuppressors } = useSuppressorsStore();

  const { posts, loading: feedLoading, error: feedError, refresh: refreshFeed } = useGunDealsFeed();

  /* Fetch all data on mount — no category filter for dashboard */
  useEffect(() => {
    fetchFirearms();
    fetchAmmunition();
    fetchSuppressors();
  }, [fetchFirearms, fetchAmmunition, fetchSuppressors]);

  const dataLoading = firearmsLoading || ammoLoading || suppressorsLoading;

  /* ---- Computed stats ---------------------------------------------- */

  const totalFirearms = firearms.length;
  const totalSuppressors = suppressors.length;
  const totalAmmoRounds = useMemo(
    () => ammunition.reduce((sum, a) => sum + (a.quantity ?? 0), 0),
    [ammunition],
  );
  const totalValue = useMemo(
    () =>
      firearms.reduce((sum, f) => sum + (f.price ?? 0), 0) +
      suppressors.reduce((sum, s) => sum + (s.price ?? 0), 0),
    [firearms, suppressors],
  );

  /* ---- Value by category ------------------------------------------- */
  const categoryStats = useMemo(() => {
    const cats: Record<string, { value: number; count: number }> = {};
    for (const cat of ['handgun', 'rifle', 'shotgun', 'nfa_firearm']) {
      cats[cat] = { value: 0, count: 0 };
    }
    for (const f of firearms) {
      const c = (f.category || 'handgun').toLowerCase();
      if (!cats[c]) cats[c] = { value: 0, count: 0 };
      cats[c].value += f.price ?? 0;
      cats[c].count += 1;
    }
    return cats;
  }, [firearms]);

  const maxCategoryValue = useMemo(
    () => Math.max(1, ...Object.values(categoryStats).map((c) => c.value)),
    [categoryStats],
  );

  /* ---- Condition breakdown ----------------------------------------- */
  const conditionStats = useMemo(() => {
    const counts: Record<Condition, number> = {
      new: 0,
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };
    for (const f of firearms) {
      const cond = (f.condition || '').toLowerCase() as Condition;
      if (cond && counts[cond] !== undefined) {
        counts[cond]++;
      }
    }
    return counts;
  }, [firearms]);

  const totalWithCondition = useMemo(
    () => Object.values(conditionStats).reduce((s, n) => s + n, 0),
    [conditionStats],
  );

  /* ---- Quick stats ------------------------------------------------- */
  const quickStats = useMemo(() => {
    const stats: { label: string; value: string }[] = [];

    // Most common caliber
    if (firearms.length > 0) {
      const calCounts: Record<string, number> = {};
      for (const f of firearms) {
        if (f.caliber) calCounts[f.caliber] = (calCounts[f.caliber] || 0) + 1;
      }
      const topCal = Object.entries(calCounts).sort((a, b) => b[1] - a[1])[0];
      if (topCal) stats.push({ label: 'Top Caliber', value: topCal[0] });
    }

    // Most common make
    if (firearms.length > 0) {
      const makeCounts: Record<string, number> = {};
      for (const f of firearms) {
        if (f.make) makeCounts[f.make] = (makeCounts[f.make] || 0) + 1;
      }
      const topMake = Object.entries(makeCounts).sort((a, b) => b[1] - a[1])[0];
      if (topMake) stats.push({ label: 'Top Make', value: topMake[0] });
    }

    // Newest addition
    if (firearms.length > 0) {
      const sorted = [...firearms].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const newest = sorted[0];
      const date = new Date(newest.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      stats.push({
        label: 'Newest',
        value: `${newest.make} ${newest.model} (${date})`,
      });
    }

    // Total photos
    const photoCount =
      firearms.reduce((s, f) => s + (f.photos?.length ?? 0), 0) +
      ammunition.reduce((s, a) => s + (a.photos?.length ?? 0), 0) +
      suppressors.reduce((s, su) => s + (su.photos?.length ?? 0), 0);
    stats.push({ label: 'Photos', value: fmtNumber(photoCount) });

    // Ammo types
    if (ammunition.length > 0) {
      const uniqueCalibers = new Set(ammunition.map((a) => a.caliber));
      stats.push({ label: 'Ammo Types', value: String(uniqueCalibers.size) });
    }

    return stats;
  }, [firearms, ammunition, suppressors]);

  /* ---- Render ------------------------------------------------------- */
  return (
    <div className={styles.page}>
      <div className={styles.fadeUp}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Your collection at a glance</p>
      </div>

      {/* ============================================================= */}
      {/* Section 1 — Summary Cards                                      */}
      {/* ============================================================= */}
      <section className={`${styles.summaryGrid} ${styles.fadeUp}`} style={{ animationDelay: '0.05s' }}>
        {dataLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><IconFirearm /></div>
              <span className={styles.statValue}>{fmtNumber(totalFirearms)}</span>
              <span className={styles.statLabel}>Firearms</span>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><IconAmmo /></div>
              <span className={styles.statValue}>{fmtNumber(totalAmmoRounds)}</span>
              <span className={styles.statLabel}>Rounds</span>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><IconSuppressor /></div>
              <span className={styles.statValue}>{fmtNumber(totalSuppressors)}</span>
              <span className={styles.statLabel}>Suppressors</span>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><IconValue /></div>
              <span className={styles.statValue}>{fmtCurrency(totalValue)}</span>
              <span className={styles.statLabel}>Total Value</span>
            </div>
          </>
        )}
      </section>

      {/* ============================================================= */}
      {/* Section 2 & 3 — Charts Row                                     */}
      {/* ============================================================= */}
      <div className={`${styles.chartsRow} ${styles.fadeUp}`} style={{ animationDelay: '0.1s' }}>
        {/* Value by Category */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Value by Category</h2>
          {dataLoading ? (
            <div className={styles.chartSkeleton}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`${styles.skeletonBar} ${styles.skeleton}`} />
              ))}
            </div>
          ) : totalFirearms === 0 ? (
            <div className={styles.emptyChart}>
              <p className={styles.emptyText}>Add firearms to see value breakdown</p>
            </div>
          ) : (
            <div className={styles.barChart}>
              {(['handgun', 'rifle', 'shotgun', 'nfa_firearm'] as const).map((cat) => {
                const stat = categoryStats[cat];
                const pct = maxCategoryValue > 0 ? (stat.value / maxCategoryValue) * 100 : 0;
                return (
                  <div key={cat} className={styles.barRow}>
                    <span className={styles.barLabel}>
                      {CATEGORY_LABELS[cat]}
                      <span className={styles.barCount}>{stat.count}</span>
                    </span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${Math.max(pct, stat.value > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{fmtCurrency(stat.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Condition Breakdown */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Condition Breakdown</h2>
          {dataLoading ? (
            <div className={styles.chartSkeleton}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`${styles.skeletonBar} ${styles.skeleton}`} />
              ))}
            </div>
          ) : totalWithCondition === 0 ? (
            <div className={styles.emptyChart}>
              <p className={styles.emptyText}>No condition data yet</p>
            </div>
          ) : (
            <div className={styles.conditionList}>
              {CONDITIONS.map((cond) => {
                const count = conditionStats[cond];
                const pct = totalWithCondition > 0 ? (count / totalWithCondition) * 100 : 0;
                return (
                  <div key={cond} className={styles.condRow}>
                    <span className={styles.condLabel}>
                      <span
                        className={styles.condDot}
                        style={{ backgroundColor: CONDITION_VARS[cond] }}
                      />
                      {CONDITION_LABELS[cond]}
                    </span>
                    <div className={styles.condTrack}>
                      <div
                        className={styles.condFill}
                        style={{
                          width: `${Math.max(pct, count > 0 ? 3 : 0)}%`,
                          backgroundColor: CONDITION_VARS[cond],
                        }}
                      />
                    </div>
                    <span className={styles.condCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ============================================================= */}
      {/* Section 4 — Quick Stats                                        */}
      {/* ============================================================= */}
      <section className={`${styles.quickStatsRow} ${styles.fadeUp}`} style={{ animationDelay: '0.15s' }}>
        {dataLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className={`${styles.chip} ${styles.skeleton}`} style={{ width: 120, height: 32 }} />
          ))
        ) : quickStats.length === 0 ? (
          <p className={styles.emptyText}>Add items to see quick stats</p>
        ) : (
          quickStats.map((stat) => (
            <div key={stat.label} className={styles.chip}>
              <span className={styles.chipLabel}>{stat.label}</span>
              <span className={styles.chipValue}>{stat.value}</span>
            </div>
          ))
        )}
      </section>

      {/* ============================================================= */}
      {/* Section 5 — r/gundeals Feed                                    */}
      {/* ============================================================= */}
      <section className={`${styles.card} ${styles.fadeUp}`} style={{ animationDelay: '0.2s' }}>
        <div className={styles.feedHeader}>
          <h2 className={styles.cardTitle}>r/gundeals Live Feed</h2>
          <div className={styles.feedActions}>
            <button
              className={styles.refreshBtn}
              onClick={refreshFeed}
              disabled={feedLoading}
              aria-label="Refresh feed"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={feedLoading ? styles.spinning : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <a
              href="https://www.reddit.com/r/gundeals/new/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.redditLink}
            >
              View on Reddit <IconExternal />
            </a>
          </div>
        </div>

        {feedLoading && posts.length === 0 ? (
          <div className={styles.feedGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonDealCard key={i} />
            ))}
          </div>
        ) : feedError ? (
          <div className={styles.emptyChart}>
            <p className={styles.emptyText}>
              Couldn&apos;t load deals: {feedError}
            </p>
            <button className={styles.retryBtn} onClick={refreshFeed}>
              Try Again
            </button>
          </div>
        ) : (
          <div className={styles.feedGrid}>
            {posts.map((post) => {
              const hasThumb =
                post.thumbnail &&
                post.thumbnail !== 'self' &&
                post.thumbnail !== 'default' &&
                post.thumbnail !== 'nsfw' &&
                post.thumbnail.startsWith('http');

              return (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.dealCard}
                >
                  {hasThumb && (
                    <img
                      src={post.thumbnail}
                      alt=""
                      className={styles.dealThumb}
                      loading="lazy"
                    />
                  )}
                  <div className={styles.dealContent}>
                    {post.link_flair_text && (
                      <span className={styles.dealFlair}>{post.link_flair_text}</span>
                    )}
                    <h3 className={styles.dealTitle}>{post.title}</h3>
                    <div className={styles.dealMeta}>
                      <span className={styles.dealStat}>
                        <IconArrowUp /> {post.score}
                      </span>
                      <span className={styles.dealStat}>
                        <IconComment /> {post.num_comments}
                      </span>
                      <span className={styles.dealTime}>{timeAgo(post.created_utc)}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export { Dashboard };
