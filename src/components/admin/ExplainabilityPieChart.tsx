// src/components/admin/ExplainabilityPieChart.tsx
import React from 'react';
import type { SourceShare } from '../../modules/admin/adminService';
import styles from './ExplainabilityPieChart.module.css';
import sourceColors from './sourceColors.module.css';

interface ExplainabilityPieChartProps {
  mediaType: 'movie' | 'tv';
  composition: SourceShare[];
  totalItems: number;
}

/**
 * Donut chart of the user's recommendation row: how many of the final titles each source produced.
 * The percentages are real counts (e.g. 3 of 12 titles = 25%), not estimated model weights.
 */
export const ExplainabilityPieChart: React.FC<ExplainabilityPieChartProps> = ({
  mediaType,
  composition,
  totalItems,
}) => {
  const radius = 68;
  const cx = 100;
  const cy = 100;

  const slices = composition.map((share, idx) => {
    const angle = (share.count / Math.max(totalItems, 1)) * 360;
    // Start angle = sum of all previous slices (computed without mutating a variable during render)
    const startAngle = composition
      .slice(0, idx)
      .reduce((sum, prev) => sum + (prev.count / Math.max(totalItems, 1)) * 360, 0);
    const endAngle = startAngle + angle;

    const toPoint = (deg: number) => ({
      x: cx + radius * Math.cos((Math.PI * (deg - 90)) / 180),
      y: cy + radius * Math.sin((Math.PI * (deg - 90)) / 180),
    });
    const start = toPoint(startAngle);
    const end = toPoint(endAngle);
    const largeArcFlag = angle > 180 ? 1 : 0;

    // A single source covering the whole row is drawn as a full circle (an arc cannot be 360 degrees)
    const pathData =
      angle >= 359.99
        ? null
        : `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;

    return { pathData, colorClass: sourceColors[share.source], share };
  });

  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 200 200" width="180" height="180" role="img" aria-label="Recommendation sources">
        {slices.map((slice) =>
          slice.pathData ? (
            <path key={slice.share.source} d={slice.pathData} className={`${styles.slice} ${slice.colorClass}`} />
          ) : (
            <circle key={slice.share.source} cx={cx} cy={cy} r={radius} className={slice.colorClass} />
          )
        )}
        <circle cx={cx} cy={cy} r="40" className={styles.hole} />
        <text x={cx} y={cy - 2} textAnchor="middle" className={styles.total}>
          {totalItems}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className={styles.totalLabel}>
          {mediaType === 'movie' ? 'movies' : 'shows'}
        </text>
      </svg>

      <div className={styles.legend}>
        {slices.map(({ share, colorClass }) => (
          <div key={share.source} className={styles.legendRow}>
            <span className={`${styles.swatch} ${colorClass}`} />
            <span className={styles.legendLabel}>{share.label}</span>
            <span className={styles.legendValue}>
              {share.count} of {totalItems} ({share.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
