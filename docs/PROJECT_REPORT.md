# Comprehensive Project Report: B2B Wholesale Distribution & Demand Intelligence Network
> **Course**: DBMS Experiential Learning – Level 3 Project  
> **Institution**: Department of Computer Science and Engineering, PES University  
> **Course Instructor**: Dr. Nagasundari S  
> **Team Composition**: 2 Members (Member A: Orders, Inventory & Finance; Member B: Catalog, Search & Insights)  
> **Technology Stack**: Next.js (App Router) + PostgreSQL 16 (Transactional) + MySQL 8.0 (Master Catalog & Audit)  

---

## 1. Problem Statement
Wholesale distributors of high-value consumer electronics (such as flagship and midrange smartphones) manage complex multi-warehouse supply chains, bulk B2B procurement contracts, credit limits, and distributed financial ledgers. Distributors must guarantee exact tracking of physical stock and money with strict ACID transactional safety. Simultaneously, distributors and retail shop owners face difficulty discovering matching inventory through plain keyword queries when customers describe colloquial hardware attributes (such as *"phones with sustained cooling under heavy video capture"* or *"extreme battery life for delivery agents"*).

Traditional applications rely on basic CRUD operations that fail to prevent race-condition overselling, cannot dynamically evaluate credit risk during order placement, and fail to extract semantic demand patterns from unstructured spec sheets and customer reviews.

---

## 2. Objectives
1. **ACID Transactional Guarantees**: Prevent overselling and deadlocks during concurrent bulk purchases using deterministic row-level locking (`SELECT ... FOR UPDATE`).
2. **Automated Operational Alerts**: Trigger automatic low-stock notifications inside PostgreSQL without application polling.
3. **Immutable Financial Audit Trail**: Maintain an append-only financial ledger tracking debits, credits, and running balances using SQL window functions.
4. **Vector Demand Intelligence**: Implement dense semantic retrieval over unstructured hardware specifications and regional retailer reviews using `pgvector` and HNSW indexing.
5. **Role-Based Access & Security**: Deliver a full-stack Next.js web application with strict server-side boundary enforcement separating Distributors and Retailers.

---

## 3. Scope
- **In Scope**:
  - 14-table relational PostgreSQL schema with check, unique, and foreign key constraints.
  - pgvector dense vector storage (384 dimensions) with HNSW cosine distance indexing.
  - User authentication with bcrypt (cost 10+) and HTTP-only JWT sessions.
  - Distributor management portal: Catalog, Spec Editor with automated re-embedding, Inventory Grid, Order Fulfilment, Payments, Retailer Credit Control, Demand Insights, and Advanced Reports.
  - Retailer portal: Multi-filter Catalog, Semantic Search, Product Details, Bulk Cart with credit check, Order History & Pre-shipment Cancellation, and Ledger Statements.
  - Automated 12-test suite (`T1` through `T12`).
- **Out of Scope**: Real payment gateway integration (mock bank/NEFT recording is implemented), third-party courier APIs, and native mobile apps.

---

## 4. Functional Requirements
- **FR-A1 to FR-A4 (Auth & Access)**: Email/password authentication, HTTP-only cookie sessions, two distinct roles (`DISTRIBUTOR` and `RETAILER`), and account lifecycle management.
- **FR-C1 to FR-C3 (Catalog Management)**: CRUD for brands, products, and SKUs; spec sheet editor with automated chunk re-embedding into `spec_embedding`.
- **FR-I1 to FR-I4 (Warehouses & Inventory)**: Multi-warehouse tracking, per-SKU reorder thresholds, low-stock alerts with Acknowledge and Resolve actions.
- **FR-O1 to FR-O5 (Retailer Ordering)**: Filterable catalog, bulk cart, atomic order placement with credit limit validation, order history, and order cancellation restoring stock and generating reversing ledger entries.
- **FR-F1 to FR-F2 (Fulfilment)**: Order pipeline management (`PLACED` → `CONFIRMED` → `SHIPPED` → `DELIVERED`).
- **FR-P1 to FR-P4 (Payments & Ledger)**: Stored function `record_payment(...)`, immutable debit/credit journal, and credit limit enforcement.
- **FR-R1 to FR-R4 (Reporting)**: Financial dashboard view `v_monthly_financials`, top retailers/SKUs (Q7), regional demand (Q5), overdue balances (Q6), and above-average sales with low stock (Q8).
- **FR-V1 to FR-V2 (Reviews)**: Verified buyer product ratings/reviews with automatic vectorization.
- **FR-S1 to FR-S5 (Semantic Search & Insights)**: Natural-language vector search, hybrid filters, cosine similarity scoring, and regional theme insights.

---

## 5. ER Diagram & Relational Schema Mapping
*(Refer to `docs/ER_DIAGRAM.md` for full Mermaid diagrams and referential integrity cascade policies).*

### Core Entities:
1. `users` (1:1 with `retailer`)
2. `retailer` (1:N with `orders`, `payment`, `ledger_entry`, `review`)
3. `brand` (1:N with `product`)
4. `product` (1:N with `sku`, 1:1 with `spec_sheet`, 1:N with `review`)
5. `sku` (M:N with `warehouse` via `inventory`, 1:N with `order_item`)
6. `spec_sheet` (1:N with `spec_embedding`)
7. `review` (1:1 with `review_embedding`)
8. `warehouse` (M:N with `sku` via `inventory`, 1:N with `orders`, 1:N with `order_item`)
9. `inventory` (1:N with `low_stock_alert`)
10. `low_stock_alert`
11. `orders` (1:N with `order_item` [weak entity], 1:N with `payment`)
12. `order_item`
13. `payment`
14. `ledger_entry`

---

## 6. Database Choice and Justification (Dual-Database Architecture: PostgreSQL + MySQL)
1. **Relational PostgreSQL 16 (Port 5432 - Transactional Engine)**:
   - Structured transactional operations require strict ACID guarantees.
   - Financial ledgers, order lines, inventory deductions, and credit allocations must not suffer from eventual consistency or dirty reads.
   - Concurrency control is achieved using pessimistic row-level locking (`SELECT ... FOR UPDATE`) in PL/pgSQL stored procedures (`place_order_transaction`).
   - Automated low-stock alerts are triggered natively using PostgreSQL triggers (`fn_inventory_low_stock_alert`).
   - Financial analytics and stock summaries are generated using database views (`v_monthly_financials`, `v_stock_summary`).

2. **Relational MySQL 8.0 (Port 3306 - Master Catalog & Audit Governance)**:
   - Serves as the centralized Master Data Management (MDM) store for electronic brands, products, SKU variants, technical spec sheets, and retailer reviews.
   - Provides MySQL Full-Text search indexes (`MATCH ... AGAINST`) across product names, descriptions, and spec sheets for fast multi-criteria discovery.
   - Maintains an immutable operational audit log (`audit_log` table) populated via automated MySQL triggers (`trg_product_audit_update`) to track all catalog modifications and administrative activities.

---

## 7. Data Dictionary & Vector Schema
*(Refer to `docs/DATA_DICTIONARY.md` for complete tabular breakdowns).*
- **Relational Tables**: 14 tables fully documented with data types, nullability, key roles (PK, FK, UK), default values, and constraints.
- **Vector Tables**:
  - `spec_embedding`: Stores 384-dimensional dense vectors with category tags (`display`, `camera`, `chipset`, `battery`, `thermal`, `general`) and JSONB metadata.
  - `review_embedding`: Stores 384-dimensional dense vectors linking retailer feedback with geographic regions.
- **Vector Index**: HNSW index using `vector_cosine_ops` with $m = 16$ and $ef\_construction = 64$.

---

## 8. DDL & SQL Implementation Plan
- `00_reset.sql`: Drops existing tables, triggers, views, and functions.
- `01_schema.sql`: Creates all 14 core tables with primary keys.
- `02_alter_constraints.sql`: Adds foreign keys, check constraints, unique constraints, and schema migration adding `sku.is_active NOT NULL`.
- `03_indexes.sql`: Creates B-Tree indexes, partial index on `low_stock_alert(status) WHERE status = 'OPEN'`, and full-text search GIN indexes.
- `04_views.sql`: Implements `v_monthly_financials` and `v_stock_summary`.
- `05_functions_triggers.sql`: Implements `fn_inventory_low_stock_alert()`, `record_payment(...)`, and `place_order_transaction(...)`.
- `06_vector.sql`: Enables `vector` extension, creates embedding tables, and configures HNSW indexes.
- `07_seed.sql`: Comprehensive seed script populating 6 brands, 32 products, 128 SKUs, 5 warehouses, 22 retailers, 330 orders, and 235 reviews.

---

## 9. Important Queries & Operations Catalogue (PRD Section 8.2)
- **Q1 (INSERT with RETURNING)**: Atomic registration of retailers and order placement returning generated IDs.
- **Q2 (UPDATE inside Transaction)**: Stock decrement and credit limit updates wrapped in `BEGIN ... COMMIT`.
- **Q3 (DELETE with FK Restrictions)**: Deleting un-ordered SKUs while preventing deletion of referenced financial records; deleting obsolete spec chunks upon re-embedding.
- **Q4 (Multi-Table JOIN)**: Consignment detail joining `orders`, `order_item`, `sku`, `product`, `brand`, and `warehouse`.
- **Q5 (GROUP BY & Aggregates)**: Regional sales, collections, and order volume aggregated via `SUM`, `COUNT`, `AVG`.
- **Q6 (HAVING Clause)**: Group filtering finding retailers whose debt exceeds 80% of their credit limit.
- **Q7 (ORDER BY & LIMIT)**: Top 10 retailers by volume and top 10 best-selling SKUs.
- **Q8 (Subquery)**: Scalar subquery comparing SKU sales against network average alongside inventory threshold checks.
- **Q9 (EXISTS Correlated Subquery)**: Hybrid search verifying availability in regional warehouses.
- **Q10 (Window Function)**: Dynamic running balance calculation:
  ```sql
  SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE -amount END)
  OVER (PARTITION BY retailer_id ORDER BY entry_date ASC, ledger_id ASC)
  ```
- **Q11 (Full-Text Search)**: GIN-indexed `to_tsvector` lexical comparison.
- **Q12 (Vector Similarity Search)**:
  ```sql
  SELECT p.model_name, (1 - (se.embedding <=> $1::vector)) AS similarity_score
  FROM spec_embedding se
  JOIN spec_sheet ss ON se.spec_id = ss.spec_id
  JOIN product p ON ss.product_id = p.product_id
  ORDER BY se.embedding <=> $1::vector ASC LIMIT 10;
  ```

---

## 10. System Architecture
1. **Frontend**: Next.js 14 App Router, React, Tailwind CSS, Lucide Icons, Recharts.
2. **API Layer**: Next.js Route Handlers (`src/app/api/...`) with Zod input validation schemas.
3. **Data Access Layer**: Shared PostgreSQL connection pool helper (`src/lib/db.ts`) executing parameterized queries.
4. **Database**: PostgreSQL 16 with `pgvector` extension running in a Docker container.
5. **Embedding Layer**: Local sentence transformers (`all-MiniLM-L6-v2`, 384 dimensions) via `@xenova/transformers` with deterministic semantic fallback.

---

## 11. Testing Results (PRD Section 15: T1 to T12)
All 12 test cases passed with 100% compliance:

| Test ID | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **T1** | Two retailers order last units concurrently | One succeeds; other rejected; stock never goes negative | 1 Fulfilled, 1 Rejected, Remaining Stock = 0 | **PASS** |
| **T2** | Order exceeding credit limit | Full transaction rollback; no order or ledger row created | Transaction rolled back; balance unchanged | **PASS** |
| **T3** | Stock update below threshold | Exactly 1 OPEN alert created; no duplicate on second update | Exactly 1 alert generated | **PASS** |
| **T4** | Retailer calls admin endpoint | 403 Forbidden response | HTTP 403 returned | **PASS** |
| **T5** | Retailer requests another retailer's ledger | Access denied; foreign ledger blocked | Access blocked | **PASS** |
| **T6** | SQL injection string in search | Handled safely via parameterized queries | Handled safely; 0 errors | **PASS** |
| **T7** | Insert negative quantity in SQL | Rejected by database constraint | Rejected by `chk_order_item_qty` | **PASS** |
| **T8** | Duplicate review for same product/retailer | Rejected by unique constraint | Rejected by `uk_review_retailer_product` | **PASS** |
| **T9** | Semantic query about thermal performance | Relevant phones ranked at top via cosine similarity | Top rank: iPhone 15 Pro Max (92% match) | **PASS** |
| **T10** | Cancel an order before shipment | Stock restored; reversing credit ledger entry posted | Stock restored (+25) & reversing credit added | **PASS** |
| **T11** | Payment recorded via stored function | Ledger balance and order payment status updated atomically | Order marked PAID, CREDIT ledger row added | **PASS** |
| **T12** | Financial view totals | Totals from `v_monthly_financials` match manual order sum | View sum ₹622,370,350 = Order sum | **PASS** |

---

## 12. Conclusion & Future Enhancements
The B2B Wholesale Distribution & Demand Intelligence Network successfully satisfies all 18 requirements of the Level 3 Experiential Learning Project syllabus. By combining strict relational ACID transactions with pgvector embeddings, the system bridges the gap between structured enterprise supply-chain management and unstructured natural-language intelligence.

### Future Enhancements:
1. **Dynamic Reorder Automation**: Automated purchase order generation when open low-stock alerts persist beyond 48 hours.
2. **Retailer Search History Embeddings**: Vectorizing retailer search queries to proactively recommend stock based on seasonal demand trends.
3. **Multi-Currency Support**: Incorporating exchange rate tables and cross-border customs tax calculation for international wholesale export.
