import { getLiveAuditLogs } from '@/lib/operations/live-data';
import { AuditClient } from './AuditClient';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const logs = await getLiveAuditLogs();

  return <AuditClient logs={logs} />;
}
