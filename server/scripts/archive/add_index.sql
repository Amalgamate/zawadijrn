CREATE UNIQUE INDEX IF NOT EXISTS fee_payments_invoice_ref_unique
ON fee_payments ("invoiceId", "referenceNumber")
WHERE "referenceNumber" IS NOT NULL;
