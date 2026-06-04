import styles from './loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.loadingPage} aria-label="Loading dashboard section">
      <div className={styles.kpiGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div className={styles.kpiCard} key={index}>
            <span />
            <strong />
            <em />
          </div>
        ))}
      </div>
      <div className={styles.contentGrid}>
        <div className={styles.largePanel} />
        <div className={styles.sidePanel} />
      </div>
      <div className={styles.bottomGrid}>
        <div />
        <div />
      </div>
    </div>
  );
}
