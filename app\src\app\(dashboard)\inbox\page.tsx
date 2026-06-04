import { getLiveApprovals } from '@/lib/operations/live-data';
import { InboxClient } from './InboxClient';

export const dynamic = 'force-dynamic';

export default async function ApprovalsInbox() {
  const approvals = await getLiveApprovals();

  return <InboxClient initialApprovals={approvals} />;
}
