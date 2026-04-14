$migrations = @(
    "20260220103503_init_and_audit_logs",
    "20260222045710_add_stamp_url",
    "20260222054217_add_location_fields",
    "20260222054520_add_branding_fields",
    "20260222090146_add_hoc_role",
    "20260223193605_add_hr_module",
    "20260223200109_add_performance_reviews",
    "20260223201254_add_accounting_module",
    "20260223202048_add_vendors_and_expenses_fixed",
    "20260223202341_add_bank_reconciliation_relations"
)

foreach ($n in $migrations) {
    $path = "prisma/migrations/$n"
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
        New-Item -ItemType File -Path "$path/migration.sql" -Force
        Write-Host "Created placeholder for $n"
    }
}
