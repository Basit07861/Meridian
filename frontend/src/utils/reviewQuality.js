export const QUALITY_THRESHOLDS = Object.freeze({
  good: 80,
  fair: 50,
});

const toScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

export const getQualityKey = (score) => {
  const normalized = toScore(score);

  if (normalized >= QUALITY_THRESHOLDS.good) return 'good';
  if (normalized >= QUALITY_THRESHOLDS.fair) return 'fair';
  return 'poor';
};

export const getQuality = (score) => {
  const key = getQualityKey(score);

  const styles = {
    good: {
      key: 'good',
      label: 'Good',
      icon: '✅',
      color: 'var(--success)',
      bg: 'var(--success-tint-10)',
      border: 'var(--success-tint-25)',
      progressGradient: 'linear-gradient(90deg,var(--success-strong),var(--success))',
    },
    fair: {
      key: 'fair',
      label: 'Fair',
      icon: '⚠️',
      color: 'var(--warning)',
      bg: 'var(--warning-tint-10)',
      border: 'var(--warning-tint-25)',
      progressGradient: 'linear-gradient(90deg,var(--warning-strong),var(--yellow))',
    },
    poor: {
      key: 'poor',
      label: 'Poor',
      icon: '🔴',
      color: 'var(--danger)',
      bg: 'var(--danger-tint-10)',
      border: 'var(--danger-tint-25)',
      progressGradient: 'linear-gradient(90deg,var(--danger-strong),var(--danger))',
    },
  };

  return styles[key];
};

export const matchesQualityFilter = (score, filter) => {
  return filter === 'all' || getQualityKey(score) === filter;
};
