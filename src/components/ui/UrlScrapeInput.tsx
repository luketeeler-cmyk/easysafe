import React, { useState } from 'react';
import styles from './UrlScrapeInput.module.css';
import { Spinner } from './Spinner';

interface UrlScrapeInputProps {
  onDataFetched: (data: Record<string, unknown>) => void;
  loading: boolean;
  onSubmit: (url: string) => void;
}

const UrlScrapeInput: React.FC<UrlScrapeInputProps> = ({
  onDataFetched: _onDataFetched,
  loading,
  onSubmit,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState('');

  const handleFetch = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFetch();
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setExpanded(true)}
      >
        <span className={styles.linkIcon} aria-hidden="true">&#128279;</span>
        Auto-fill from URL
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.hint}>Paste a product URL to auto-fill fields</p>
      <div className={styles.inputRow}>
        <input
          type="url"
          className={styles.input}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://..."
          disabled={loading}
          aria-label="Product URL"
        />
        <button
          type="button"
          className={styles.fetchBtn}
          onClick={handleFetch}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <Spinner size={16} color="currentColor" />
          ) : (
            'Fetch'
          )}
        </button>
      </div>
    </div>
  );
};

export { UrlScrapeInput };
