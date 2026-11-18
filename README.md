# B2B Wholesale Distribution & Demand Intelligence Network
> **DBMS Experiential Learning, Level 3 Project** | Stack: Next.js + PostgreSQL + pgvector

---

## 1. Project Overview
NexusMobile is an enterprise B2B web portal engineered for mobile-phone wholesale distributors and their independent retail store network. It solves high-value electronic distribution challenges through strict SQL guarantees, transactional bulk ordering with credit controls, and vector embeddings for semantic hardware and review search.

### Two Databases in One Instance:
1. **Relational PostgreSQL (14 Tables)**: Enforces strict ACID guarantees, atomic transactions, row-level locks (`SELECT ... FOR UPDATE`), triggers, stored procedures, check constraints, cascading/restricting foreign keys, and analytical views.
2. **pgvector (HNSW Cosine Distance)**: Indexes 384-dimensional dense sentence embeddings (`all-MiniLM-L6-v2`) over chunked hardware specifications and retailer field feedback for natural language demand intelligence.

---

## 2. Team Members & Responsibilities (PRD Section 16)

| Member | Feature Slice | Database Ownership | Application Ownership |
| :--- | :--- | :--- | :--- |
| **Member A** | **Orders, Inventory & Finance** | `warehouse`, `inventory`, `orders`, `order_item`, `payment`, `ledger_entry`; `place_order` transaction; low-stock trigger; `v_monthly_financials`; `record_payment()` | Inventory grid, bulk ordering & checkout, order fulfilment, payment recording, ledger statements, financial dashboard |
| **Member B** | **Catalog, Search & Insights** | `brand`, `product`, `sku`, `spec_sheet`, `review`; `spec_embedding` and `review_embedding` tables; HNSW index; full-text GIN search | Catalog browsing, spec editor, semantic search page, review submission & vectorization, demand insights |

---

## 3. Prerequisites
- **Node.js**: `v18.x` or later (tested on `v22.23.2`)
- **npm**: `v9.x` or later
- **PostgreSQL**: `v15+` or `v16+` with `pgvector` extension installed
- **Docker** (Optional, recommended for 1-command database launch)

---

## 4. Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Configuration Table (PRD Section 16.1):
| Variable Name | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with pgvector enabled | `postgresql://postgres:postgres@localhost:5432/wholesale_db` |
| `JWT_SECRET` | Secret key for signing HTTP-only session JWT cookies | `wholesale_b2b_secret_key_super_secure_2026_level3_jwt` |
| `EMBEDDING_MODEL`| Local dense vector model | `all-MiniLM-L6-v2` |
| `PORT` | Local web server listening port | `3000` |

---

## 5. Database Setup & Execution Sequence (PRD Section 8.1)

All database scripts run from an empty database in strict ordered sequence:

```
db/
 ├── 00_reset.sql              # Clean DROP ... CASCADE of tables, views, triggers, functions
 ├── 01_schema.sql             # CREATE TABLE for all 14 tables with Primary Keys
 ├── 02_alter_constraints.sql  # Adds FKs, CHECKs, UNIQUE constraints, and column migration
 ├── 03_indexes.sql            # B-Tree, partial index on low_stock_alert, GIN full-text indexes
 ├── 04_views.sql              # Creates v_monthly_financials and v_stock_summary
 ├── 05_functions_triggers.sql # Creates low-stock trigger, record_payment(), place_order_transaction()
 └── 06_vector.sql             # Enables pgvector extension, spec_embedding, review_embedding & HNSW index
```

### Option A: Automated Runner (Recommended)
```bash
# 1. Start PostgreSQL with pgvector (via Docker Compose)
docker compose up -d

# 2. Run all DDL migration scripts in sequence (00 to 06)
npm run db:setup

# 3. Seed 6 brands, 32 products, 110+ SKUs, 5 warehouses, 22 retailers, 330+ orders, 80+ reviews
npm run db:seed

# 4. Generate 384-dimensional vector embeddings for specs and reviews
npm run db:embed
```

### Option B: Manual Execution via psql
```bash
psql -d wholesale_db -f db/00_reset.sql
psql -d wholesale_db -f db/01_schema.sql
psql -d wholesale_db -f db/02_alter_constraints.sql
psql -d wholesale_db -f db/03_indexes.sql
psql -d wholesale_db -f db/04_views.sql
psql -d wholesale_db -f db/05_functions_triggers.sql
psql -d wholesale_db -f db/06_vector.sql
node scripts/seed.js
node scripts/generate_embeddings.js
```

---

## 6. Starting the Application

```bash
# Start Next.js development server
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 7. Demo Accounts (PRD Section 15 & 16.1)
The application includes pre-configured demo profiles with 1-click login buttons on `/login`:

| Role | Email | Password | Access & Permissions |
| :--- | :--- | :--- | :--- |
| **Distributor (Admin)** | `distributor@wholesale.com` | `Admin@12345` | Financial dashboard, catalog CRUD, spec editor, inventory grid, order fulfilment, payment recording, demand insights |
| **Retailer (Customer)** | `retailer1@shop.com` | `Retailer@12345` | Wholesale catalog, semantic search, bulk checkout with credit limit check, order history, cancellation, ledger statement |

*(Note: Additional retailers `retailer2@shop.com` through `retailer22@shop.com` exist with the same password).*

---

## 8. Automated Testing Suite (T1 - T12)
Run all 12 mandatory PRD test cases with one command:

```bash
npm run test:all
```

### Test Mapping:
- **T1**: Two retailers order the last units concurrently *(Stock never goes negative; one succeeds, one rejected)*
- **T2**: Order exceeding credit limit *(Full transaction rollback; no stock change or ledger debit)*
- **T3**: Stock update below threshold *(Trigger creates exactly one OPEN alert; no duplicate on second update)*
- **T4**: Retailer calls admin endpoint *(403 Forbidden response)*
- **T5**: Retailer requests another retailer's ledger *(Access denied; cross-retailer leak blocked)*
- **T6**: SQL injection string in search and filters *(Handled safely via parameterized queries)*
- **T7**: Insert negative quantity directly in SQL *(Rejected by CHECK constraint `chk_order_item_qty`)*
- **T8**: Duplicate review for the same retailer and product *(Rejected by UNIQUE constraint `uk_review_retailer_product`)*
- **T9**: Semantic query about thermal performance and video *(Relevant phones ranked at top via cosine similarity)*
- **T10**: Cancel an order before shipment *(Stock restored to inventory; reversing ledger entry posted)*
- **T11**: Payment recorded *(Stored function `record_payment()` updates ledger and order status atomically)*
- **T12**: Financial view totals *(Calculated totals from `v_monthly_financials` match manual SQL order sums)*

---

## 9. Folder Structure
```
mini-project/
 ├── db/
 │    ├── 00_reset.sql
 │    ├── 01_schema.sql
 │    ├── 02_alter_constraints.sql
 │    ├── 03_indexes.sql
 │    ├── 04_views.sql
 │    ├── 05_functions_triggers.sql
 │    └── 06_vector.sql
 ├── docs/
 │    ├── DATA_DICTIONARY.md
 │    └── ER_DIAGRAM.md
 ├── scripts/
 │    ├── run_migrations.js
 │    ├── seed.js
 │    ├── generate_embeddings.js
 │    └── run_tests.js
 ├── src/
 │    ├── app/
 │    │    ├── api/
 │    │    │    ├── auth/
 │    │    │    ├── products/
 │    │    │    ├── skus/
 │    │    │    ├── brands/
 │    │    │    ├── warehouses/
 │    │    │    ├── inventory/
 │    │    │    ├── alerts/
 │    │    │    ├── orders/
 │    │    │    ├── payments/
 │    │    │    ├── ledger/
 │    │    │    ├── retailers/
 │    │    │    ├── reviews/
 │    │    │    ├── search/
 │    │    │    ├── insights/
 │    │    │    └── reports/
 │    │    ├── retailer/
 │    │    │    ├── catalog/
 │    │    │    ├── search/
 │    │    │    ├── products/[id]/
 │    │    │    ├── cart/
 │    │    │    ├── orders/
 │    │    │    └── ledger/
 │    │    ├── admin/
 │    │    │    ├── dashboard/
 │    │    │    ├── catalog/
 │    │    │    ├── inventory/
 │    │    │    ├── orders/
 │    │    │    ├── retailers/
 │    │    │    ├── payments/
 │    │    │    ├── statements/
 │    │    │    ├── insights/
 │    │    │    └── reports/
 │    │    ├── login/
 │    │    ├── unauthorized/
 │    │    ├── layout.tsx
 │    │    └── page.tsx
 │    ├── components/
 │    │    └── Navbar.tsx
 │    ├── context/
 │    │    └── CartContext.tsx
 │    ├── lib/
 │    │    ├── db.ts
 │    │    ├── auth.ts
 │    │    └── embeddings.ts
 │    └── middleware.ts
 ├── docker-compose.yml
 ├── package.json
 ├── tailwind.config.js
 ├── tsconfig.json
 └── .env.example
```
