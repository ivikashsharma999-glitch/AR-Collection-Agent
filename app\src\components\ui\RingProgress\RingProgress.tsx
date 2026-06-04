'use client';

import React, { useEffect, useState } from 'react';
import styles from './RingProgress.module.css';

interface RingProgressProps {
  percentage: number;
  label: string;
  subLabel?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function RingProgress({ 
  percentage, 
  label, 
  subLabel,
  color = 'var(--brand-primary)', 
  size = 140, 
  strokeWidth = 10 
}: RingProgressProps) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => {
      setAnimatedPct(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference;

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Drop shadow definition for glow */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <circle
          className={styles.track}
          stroke="var(--bg-hover)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Animated progress ring */}
        <circle
          className={styles.progress}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
          filter="url(#glow)"
        />
      </svg>
      
      {/* Center text */}
      <div className={styles.centerText}>
        <span className={styles.percentage} style={{ color }}>
          {animatedPct}<span className={styles.percentSign}>%</span>
        </span>
        <span className={styles.label}>{label}</span>
        {subLabel && <span className={styles.subLabel}>{subLabel}</span>}
      </div>
    </div>
  );
}
