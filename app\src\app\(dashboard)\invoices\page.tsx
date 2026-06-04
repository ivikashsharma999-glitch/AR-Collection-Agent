import { getLiveInvoices } from '@/lib/operations/live-data';
import { InvoicesClient } from './InvoicesClient';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const invoices = await getLiveInvoices();

  return <InvoicesClient invoices={invoices} />;
}
