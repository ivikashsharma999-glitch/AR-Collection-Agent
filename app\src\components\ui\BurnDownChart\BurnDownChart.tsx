'use client';

import React, { useEffect, useState } from 'react';
import styles from './BurnDownChart.module.css';

interface Point {
  day: number;
  expected: number;
  actual: number;
}

interface BurnDownChartProps {
  data: Point[];
  width?: number;
  height?: number;
}

export function BurnDownChart({ data, width = 600, height = 240 }: BurnDownChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay slightly to trigger CSS animations on mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Max value for Y scale (adding 10% padding on top)
  const maxValue = Math.max(...data.map(d => Math.max(d.expected, d.actual))) * 1.1;

  // Helpers to map data to SVG coordinates
  const getX = (index: number) => padding.left + (index / (data.length - 1)) * graphWidth;
  const getY = (value: number) => padding.top + graphHeight - (value / maxValue) * graphHeight;

  // Generate SVG path for "Expected" (ideal burn down)
  const expectedPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.expected)}`)
    .join(' ');

  // Generate SVG path for "Actual"
  const actualPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.actual)}`)
    .join(' ');

  // Generate Area under "Actual"
  const actualArea = `
    ${actualPath}
    L ${getX(data.length - 1)} ${padding.top + graphHeight}
    L ${getX(0)} ${padding.top + graphHeight}
    Z
  `;

  // Grid lines (horizontal)
  const yAxisTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => maxValue * pct);

  return (
    <div className={styles.container} style={{ width: '100%', maxWidth: width, height }}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.0" />
          </linearGradient>
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Y Axis Grid & Labels */}
        {yAxisTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={getY(tick)}
              x2={width - padding.right}
              y2={getY(tick)}
              className={styles.gridLine}
            />
            <text
              x={padding.left - 10}
              y={getY(tick) + 4}
              className={styles.axisLabel}
              textAnchor="end"
            >
              ${(tick / 1000).toFixed(0)}k
            </text>
          </g>
        ))}

        {/* X Axis Labels (First, Middle, Last) */}
        <text x={getX(0)} y={height - 5} className={styles.axisLabel} textAnchor="start">Day 1</text>
        <text x={getX(Math.floor(data.length / 2))} y={height - 5} className={styles.axisLabel} textAnchor="middle">Day 15</text>
        <text x={getX(data.length - 1)} y={height - 5} className={styles.axisLabel} textAnchor="end">Day 30</text>

        {/* Expected Line (Dashed) */}
        <path
          d={expectedPath}
          className={styles.expectedLine}
        />

        {/* Actual Area & Line (Animated) */}
        <g style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          <path
            d={actualArea}
            fill="url(#areaGradient)"
            className={`${styles.actualArea} ${mounted ? styles.animateArea : ''}`}
          />
          <path
            d={actualPath}
            className={`${styles.actualLine} ${mounted ? styles.animateLine : ''}`}
            filter="url(#lineGlow)"
          />
        </g>
        
        {/* Data points for Actual */}
        {mounted && data.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.actual)}
            r={3}
            className={styles.point}
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
