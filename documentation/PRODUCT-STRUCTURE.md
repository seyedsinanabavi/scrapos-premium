# ScrapOS Product Structure

## Core modules
1. Dashboard and business analytics
2. Weighbridge and weighing tickets
3. Inventory and warehouses
4. Configurable material catalog and grades
5. Purchase management
6. Sales management
7. Processing batches and yield
8. Suppliers and customers
9. Finance, receipts, payments and expenses
10. Fleet and transport orders
11. Reports and exports
12. Users, roles, branches and settings

## Production architecture target
- Frontend: HTML/CSS/JavaScript
- Backend: Laravel REST API
- Database: PostgreSQL
- Tenant isolation: organization_id + branch_id on operational records
- Auditability: append-only inventory movements and audit logs
- Hardware integration: weighbridge adapter service

## Important domain rules
- Inventory changes must be represented by ledger movements, not silent quantity overwrites.
- Weight tickets should preserve gross, tare, net, vehicle, operator, timestamps and correction history.
- Processing batches should record input, outputs, losses, costs and yield percentage.
- Material attributes must be configurable by category.
- Financial transactions must link to source documents and support reconciliation.
