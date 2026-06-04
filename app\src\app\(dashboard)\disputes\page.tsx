import { getLiveDisputes } from '@/lib/operations/live-data';
import { DisputesClient } from './DisputesClient';

export const dynamic = 'force-dynamic';

export default async function DisputesPage() {
  const disputes = await getLiveDisputes();

  return <DisputesClient disputes={disputes} />;
}
