import { getLivePromises } from '@/lib/operations/live-data';
import { PromisesClient } from './PromisesClient';

export const dynamic = 'force-dynamic';

export default async function PromisesPage() {
  const promises = await getLivePromises();

  return <PromisesClient promises={promises} />;
}
