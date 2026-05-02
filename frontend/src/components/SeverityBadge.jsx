// ============ SeverityBadge.jsx ============
// Copy this into: frontend/src/components/SeverityBadge.jsx

export default function SeverityBadge({ severity }) {
  const styles = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };

  const icons = { high: '🔴', medium: '🟡', low: '🟢' };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[severity] || styles.low}`}>
      {icons[severity]} {severity}
    </span>
  );
}
