-- Add unique constraints to allow UPSERT operations during QuickBooks sync
ALTER TABLE customers ADD CONSTRAINT customers_org_id_qb_customer_id_key UNIQUE (org_id, qb_customer_id);
ALTER TABLE invoices ADD CONSTRAINT invoices_org_id_qb_invoice_id_key UNIQUE (org_id, qb_invoice_id);
