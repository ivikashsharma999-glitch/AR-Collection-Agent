import { getLiveAuditLogs } from '@/lib/operations/live-data';
import { AIActivityClient } from './AIActivityClient';

export const dynamic = 'force-dynamic';

export default async function AIActivityCenter() {
  const activity = await getLiveAuditLogs();

  return <AIActivityClient activity={activity} />;
}
