// src/components/ExplainabilityPieChart.tsx
import React from 'react';
import type { RecommendationFactor } from '../modules/adminService';

interface ExplainabilityPieChartProps {
  mediaTitle: string;
  mediaType: 'movie' | 'tv';
  rating: number;
  factors: RecommendationFactor[];
}

const PALETTE = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const ExplainabilityPieChart: React.FC<ExplainabilityPieChartProps> = ({
  mediaTitle,
  mediaType,
  rating,
  factors,
}) => {
  let cumulativeAngle = 0;
  const radius = 68;
  const cx = 100;
  const cy = 100;

  const slices = factors.map((f, idx) => {
    const angle = (f.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startX = cx + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const startY = cy + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const endX = cx + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const endY = cy + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

    return {
      pathData,
      color: PALETTE[idx % PALETTE.length],
      factor: f,
    };
  });

  return (
    <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1.5rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1f2937', paddingBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 700 }}>
            {mediaType === 'movie' ? '🎬 Movie Recommendation Origin' : '📺 TV Show Recommendation Origin'}
          </span>
          <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', color: '#fff' }}>{mediaTitle}</h3>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#eab308', fontWeight: 700, backgroundColor: '#27272a', padding: '4px 10px', borderRadius: '6px' }}>
          ★ {rating} / 10
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
        {/* Pie Graphic */}
        <div style={{ position: 'relative', width: '200px', height: '200px' }}>
          <svg viewBox="0 0 200 200" width="200" height="200">
            {slices.map((slice, i) => (
              <path key={i} d={slice.pathData} fill={slice.color} stroke="#09090b" strokeWidth="2" />
            ))}
            <circle cx={cx} cy={cy} r="38" fill="#111827" />
            <text x={cx} y={cy + 4} textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="700">
              Algorithm %
            </text>
          </svg>
        </div>

        {/* Breakdown List */}
        <div style={{ flex: 1, minWidth: '280px', display: 'grid', gap: '0.85rem' }}>
          {factors.map((f, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  backgroundColor: PALETTE[idx % PALETTE.length],
                  marginTop: '3px',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f4f4f5' }}>
                  {f.sourceName} — <strong style={{ color: PALETTE[idx % PALETTE.length] }}>{f.percentage}%</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                  {f.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};  