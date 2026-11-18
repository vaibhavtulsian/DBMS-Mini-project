# Data Dictionary: Relational Schema & Vector Model
> **PRD Section 18.1 Deliverable (PDF Items 4 & 14)**  
> System: **B2B Wholesale Distribution & Demand Intelligence Network**

---

## 1. Relational Data Dictionary (14 Tables)

### Table 1: `users`
*System authentication accounts and access roles.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `user_id` | SERIAL | NO | PK | Auto-increment | Unique identifier for system user account |
| `email` | VARCHAR(255) | NO | UK | `UNIQUE` | Unique user login email address |
| `password_hash` | VARCHAR(255) | NO | - | bcrypt hash (cost ≥ 10) | Securely hashed password digest |
| `role` | VARCHAR(50) | NO | - | `CHECK (role IN ('DISTRIBUTOR', 'RETAILER'))` | System access role boundary |
| `is_active` | BOOLEAN | NO | - | `DEFAULT TRUE` | Account activation state flag |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |

---

### Table 2: `retailer`
*Retail business customer profile, territory, and credit allocation.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `retailer_id` | SERIAL | NO | PK | Auto-increment | Primary key for retailer profile |
| `user_id` | INT | NO | FK, UK | `REFERENCES users(user_id) ON DELETE RESTRICT` | Associated authentication user |
| `business_name` | VARCHAR(255) | NO | - | - | Trade name of the retail store |
| `contact_person`| VARCHAR(100) | YES | - | - | Store owner or authorized buyer name |
| `gstin` | VARCHAR(15) | NO | UK | `UNIQUE, CHECK (LENGTH(TRIM(gstin)) = 15)` | Government Tax Identifier (15 chars) |
| `phone` | VARCHAR(20) | NO | - | - | Contact business phone number |
| `city` | VARCHAR(100) | NO | - | - | Operating commercial city |
| `region` | VARCHAR(50) | NO | - | - | Distribution territory (North, South, East, West, Central) |
| `credit_limit` | NUMERIC(12,2)| NO | - | `CHECK (credit_limit >= 0) DEFAULT 50000.00` | Approved bulk order credit ceiling |
| `outstanding_balance`| NUMERIC(12,2)| NO | - | `CHECK (outstanding_balance >= 0) DEFAULT 0.00`| Current unpaid balance / exposure |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Onboarding timestamp |

---

### Table 3: `brand`
*Smartphone manufacturers.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `brand_id` | SERIAL | NO | PK | Auto-increment | Unique identifier for the brand |
| `brand_name` | VARCHAR(100) | NO | UK | `UNIQUE` | Brand trade name (Apple, Samsung, etc.) |
| `country_of_origin` | VARCHAR(100)| YES | - | - | Manufacturing headquarters country |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | System creation timestamp |

---

### Table 4: `product`
*Phone base models.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `product_id` | SERIAL | NO | PK | Auto-increment | Primary key for phone model |
| `brand_id` | INT | NO | FK | `REFERENCES brand(brand_id) ON DELETE RESTRICT` | Manufacturer reference |
| `model_name` | VARCHAR(150) | NO | - | - | Model release name |
| `release_year`| INT | NO | - | - | Market launch year |
| `base_description` | TEXT | YES | - | - | Marketing and overview summary |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

---

### Table 5: `sku`
*Stock Keeping Units representing specific hardware configurations and wholesale prices.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sku_id` | SERIAL | NO | PK | Auto-increment | Unique SKU identifier |
| `product_id` | INT | NO | FK | `REFERENCES product(product_id) ON DELETE RESTRICT`| Base phone model reference |
| `sku_code` | VARCHAR(100) | NO | UK | `UNIQUE` | Human-readable barcode / SKU code |
| `ram_gb` | INT | NO | - | `CHECK (ram_gb > 0)` | RAM size in gigabytes |
| `storage_gb` | INT | NO | - | `CHECK (storage_gb > 0)` | Internal storage in gigabytes |
| `color` | VARCHAR(50) | NO | - | - | Color variant name |
| `wholesale_price` | NUMERIC(12,2)| NO | - | `CHECK (wholesale_price > 0)` | Unit price per item in INR |
| `is_active` | BOOLEAN | NO | - | `DEFAULT TRUE` (Added in migration) | Active status in catalog |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | SKU creation timestamp |

---

### Table 6: `spec_sheet`
*Technical specification sheets used for semantic chunking and full-text search.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `spec_id` | SERIAL | NO | PK | Auto-increment | Specification sheet ID |
| `product_id` | INT | NO | FK, UK | `REFERENCES product(product_id) ON DELETE CASCADE`| One-to-one phone model linkage |
| `spec_text` | TEXT | NO | - | - | Overall 120-200 word summary |
| `display_specs`| TEXT | YES | - | - | Display type, resolution, and refresh rate |
| `camera_specs` | TEXT | YES | - | - | Camera sensor, optical zoom, and video modes |
| `chipset_specs`| TEXT | YES | - | - | Processor, GPU, and fabrication node |
| `battery_specs`| TEXT | YES | - | - | Battery capacity (mAh) and charging speeds |
| `thermal_specs`| TEXT | YES | - | - | Vapor chamber, cooling, heat dissipation |
| `updated_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Last modified timestamp |

---

### Table 7: `review`
*Retailer customer reviews and field evaluations.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `review_id` | SERIAL | NO | PK | Auto-increment | Review identifier |
| `retailer_id`| INT | NO | FK | `REFERENCES retailer(retailer_id) ON DELETE RESTRICT`| Reviewing retailer |
| `product_id` | INT | NO | FK | `REFERENCES product(product_id) ON DELETE RESTRICT`| Reviewed phone model |
| `rating` | INT | NO | - | `CHECK (rating BETWEEN 1 AND 5)` | Star rating (1 to 5) |
| `review_text`| TEXT | NO | - | - | Qualitative field evaluation |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Review timestamp |
| *(Composite)*| - | - | UK | `UNIQUE (retailer_id, product_id)` | Max one review per retailer per product |

---

### Table 8: `warehouse`
*Regional logistics and distribution centers.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `warehouse_id` | SERIAL | NO | PK | Auto-increment | Distribution center ID |
| `warehouse_name`| VARCHAR(150)| NO | - | - | Facility trade name |
| `city` | VARCHAR(100) | NO | - | - | Operating city |
| `region` | VARCHAR(50) | NO | - | - | Logistics region (North, South, East, West, Central) |
| `capacity` | INT | NO | - | `CHECK (capacity > 0)` | Maximum unit physical storage capacity |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

---

### Table 9: `inventory`
*Stock levels and reorder thresholds per warehouse and SKU.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `warehouse_id` | INT | NO | PK, FK | `REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT`| Location reference |
| `sku_id` | INT | NO | PK, FK | `REFERENCES sku(sku_id) ON DELETE RESTRICT` | Stock keeping unit reference |
| `quantity_on_hand`| INT | NO | - | `CHECK (quantity_on_hand >= 0) DEFAULT 0` | Available physical units in stock |
| `reorder_threshold`| INT | NO | - | `CHECK (reorder_threshold >= 0) DEFAULT 15`| Threshold triggering low-stock alerts |
| `last_restocked_at`| TIMESTAMPTZ| YES | - | - | Timestamp of last stock replenishment |
| `updated_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Last updated timestamp |

---

### Table 10: `low_stock_alert`
*Operational inventory alerts generated automatically by database triggers.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `alert_id` | SERIAL | NO | PK | Auto-increment | Alert record identifier |
| `warehouse_id` | INT | NO | FK | Composite FK to `inventory(warehouse_id, sku_id)` | Warehouse location |
| `sku_id` | INT | NO | FK | Composite FK to `inventory(warehouse_id, sku_id)` | Stock keeping unit |
| `threshold_value`| INT | NO | - | - | Threshold at alert trigger |
| `current_quantity`| INT | NO | - | - | Depleted stock quantity at trigger |
| `status` | VARCHAR(20) | NO | - | `CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED'))`| Alert resolution lifecycle |
| `created_at` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Trigger timestamp |
| `resolved_at`| TIMESTAMPTZ| YES | - | - | Closure timestamp |

---

### Table 11: `orders`
*Consignment order headers.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `order_id` | SERIAL | NO | PK | Auto-increment | Order consignment ID |
| `retailer_id`| INT | NO | FK | `REFERENCES retailer(retailer_id) ON DELETE RESTRICT`| Purchasing retailer |
| `order_date` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Timestamp order was committed |
| `status` | VARCHAR(30) | NO | - | `CHECK (status IN ('PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'))`| Fulfilment pipeline status |
| `total_amount`| NUMERIC(12,2)| NO | - | `CHECK (total_amount >= 0) DEFAULT 0.00`| Total invoice payable amount |
| `payment_status`| VARCHAR(30)| NO | - | `CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID'))`| Settlement tracking |
| `shipping_warehouse_id`| INT | YES | FK | `REFERENCES warehouse(warehouse_id) ON DELETE SET NULL`| Originating dispatch hub |
| `notes` | TEXT | YES | - | - | Logistics instructions |

---

### Table 12: `order_item`
*Order lines (Weak entity dependent on `orders`).*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `order_id` | INT | NO | PK, FK | `REFERENCES orders(order_id) ON DELETE CASCADE` | Parent order header |
| `line_no` | INT | NO | PK | Weak entity sequence number (1, 2, 3...) | Line position within order |
| `sku_id` | INT | NO | FK | `REFERENCES sku(sku_id) ON DELETE RESTRICT` | Ordered SKU variant |
| `warehouse_id`| INT | NO | FK | `REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT`| Allocated fulfillment hub |
| `quantity` | INT | NO | - | `CHECK (quantity > 0)` | Ordered unit count |
| `unit_price` | NUMERIC(12,2)| NO | - | `CHECK (unit_price > 0)` | Locked unit wholesale price |
| `line_total` | NUMERIC(12,2)| NO | - | `GENERATED ALWAYS AS (quantity * unit_price) STORED`| Subtotal computed by database |

---

### Table 13: `payment`
*Monetary collections recorded against retailer accounts and orders.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment_id` | SERIAL | NO | PK | Auto-increment | Payment ledger receipt ID |
| `retailer_id`| INT | NO | FK | `REFERENCES retailer(retailer_id) ON DELETE RESTRICT`| Remitting retailer |
| `order_id` | INT | YES | FK | `REFERENCES orders(order_id) ON DELETE SET NULL`| Associated order (if applicable) |
| `amount` | NUMERIC(12,2)| NO | - | `CHECK (amount > 0)` | Remittance amount in INR |
| `payment_method`| VARCHAR(50)| NO | - | `CHECK (payment_method IN ('BANK_TRANSFER', 'CHEQUE', 'NEFT_RTGS', 'UPI', 'CASH'))`| Banking channel |
| `reference_no`| VARCHAR(100)| NO | - | - | Bank UTR / Cheque / Transaction reference |
| `payment_date`| TIMESTAMPTZ| NO | - | `DEFAULT CURRENT_TIMESTAMP` | Receipt timestamp |
| `notes` | TEXT | YES | - | - | Internal audit annotations |

---

### Table 14: `ledger_entry`
*Immutable, append-only financial journal for auditability.*
| Column | Data Type | Nullable | Key | Constraints / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ledger_id` | SERIAL | NO | PK | Auto-increment | Financial journal entry ID |
| `retailer_id`| INT | NO | FK | `REFERENCES retailer(retailer_id) ON DELETE RESTRICT`| Retailer account |
| `entry_type` | VARCHAR(10) | NO | - | `CHECK (entry_type IN ('DEBIT', 'CREDIT'))` | Financial transaction classification |
| `amount` | NUMERIC(12,2)| NO | - | `CHECK (amount > 0)` | Transaction magnitude |
| `balance_after`| NUMERIC(12,2)| NO | - | - | Snapshot running debt balance |
| `reference_type`| VARCHAR(50)| NO | - | `ORDER_PLACED`, `ORDER_CANCELLED`, `PAYMENT_RECEIVED` | Business event trigger |
| `reference_id`| INT | YES | - | - | Foreign ID of order or payment |
| `notes` | TEXT | YES | - | - | Journal description |
| `entry_date` | TIMESTAMPTZ | NO | - | `DEFAULT CURRENT_TIMESTAMP` | Immutable entry timestamp |

---

## 2. Vector Data Model & pgvector Documentation (PRD Section 7.3)

### Vector Architecture Overview:
- **Vector Extension**: PostgreSQL `vector` (pgvector)
- **Embedding Model**: `all-MiniLM-L6-v2` sentence transformers (run locally in Node.js)
- **Dimensions**: 384 dimensions, normalized to unit length ($L_2$ norm = 1.0)
- **Distance Metric**: Cosine distance (`<=>` operator), where $\text{similarity} = 1 - \text{distance}$
- **Indexing Method**: HNSW (Hierarchical Navigable Small World) with `vector_cosine_ops` parameters `(m = 16, ef_construction = 64)`

### Vector Table 1: `spec_embedding`
*Hardware specification chunks split into functional categories.*
| Column | Data Type | Key | Description |
| :--- | :--- | :--- | :--- |
| `embedding_id` | SERIAL | PK | Unique chunk embedding identifier |
| `spec_id` | INT | FK | `REFERENCES spec_sheet(spec_id) ON DELETE CASCADE` |
| `chunk_category`| VARCHAR(50) | - | Category (`display`, `camera`, `chipset`, `battery`, `thermal`, `general`) |
| `chunk_text` | TEXT | - | Verbatim text content of chunk |
| `embedding` | `vector(384)` | - | 384-dimensional dense vector |
| `metadata` | `JSONB` | - | Structured metadata (`product_id`, `model_name`, `brand_name`) |
| `created_at` | TIMESTAMPTZ | - | Embedding generation timestamp |

### Vector Table 2: `review_embedding`
*Retailer field feedback reviews embedded for regional sentiment and demand search.*
| Column | Data Type | Key | Description |
| :--- | :--- | :--- | :--- |
| `review_id` | INT | PK, FK | `REFERENCES review(review_id) ON DELETE CASCADE` |
| `chunk_text` | TEXT | - | Review text prepended with product model and region |
| `embedding` | `vector(384)` | - | 384-dimensional dense vector |
| `region` | VARCHAR(50) | - | Geographic region of the reviewing retailer |
| `created_at` | TIMESTAMPTZ | - | Embedding timestamp |
