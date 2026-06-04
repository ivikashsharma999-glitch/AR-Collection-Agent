import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return <DashboardClient metrics={metrics} />;
}
