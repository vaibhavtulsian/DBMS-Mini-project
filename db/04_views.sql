-- ============================================================================
-- 04_views.sql: Database Views for Financial & Inventory Reporting
-- PRD Section 7.1, 8.1, 8.2
-- ============================================================================

-- 1. Financial Dashboard Monthly View
-- Aggregates monthly orders, total value, collections, and pending balances per retailer
CREATE OR REPLACE VIEW v_monthly_financials AS
SELECT 
    DATE_TRUNC('month', o.order_date)::DATE AS financial_month,
    r.retailer_id,
    r.business_name,
    r.region,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0.00) AS total_order_value,
    COALESCE(p_summary.total_payments, 0.00) AS total_collected,
    (COALESCE(SUM(o.total_amount), 0.00) - COALESCE(p_summary.total_payments, 0.00)) AS net_pending_period,
    r.outstanding_balance AS current_total_balance
FROM retailer r
JOIN orders o ON r.retailer_id = o.retailer_id AND o.status != 'CANCELLED'
LEFT JOIN (
    SELECT 
        DATE_TRUNC('month', payment_date)::DATE AS pay_month,
        retailer_id,
        SUM(amount) AS total_payments
    FROM payment
    GROUP BY DATE_TRUNC('month', payment_date)::DATE, retailer_id
) p_summary ON p_summary.retailer_id = r.retailer_id 
           AND p_summary.pay_month = DATE_TRUNC('month', o.order_date)::DATE
GROUP BY 
    DATE_TRUNC('month', o.order_date)::DATE,
    r.retailer_id,
    r.business_name,
    r.region,
    p_summary.total_payments,
    r.outstanding_balance;

-- 2. Stock Summary View for Inventory Management Grid
-- Aggregates inventory across all warehouses with brand and model metadata
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT 
    s.sku_id,
    s.sku_code,
    s.wholesale_price,
    s.ram_gb,
    s.storage_gb,
    s.color,
    s.is_active,
    p.product_id,
    p.model_name,
    b.brand_id,
    b.brand_name,
    COALESCE(SUM(i.quantity_on_hand), 0)::INT AS total_quantity_on_hand,
    COALESCE(SUM(i.reorder_threshold), 0)::INT AS aggregate_reorder_threshold,
    COUNT(DISTINCT i.warehouse_id)::INT AS active_warehouses_count,
    CASE 
        WHEN COALESCE(SUM(i.quantity_on_hand), 0) <= COALESCE(SUM(i.reorder_threshold), 0) THEN TRUE 
        ELSE FALSE 
    END AS is_low_stock_overall
FROM sku s
JOIN product p ON s.product_id = p.product_id
JOIN brand b ON p.brand_id = b.brand_id
LEFT JOIN inventory i ON s.sku_id = i.sku_id
GROUP BY 
    s.sku_id, s.sku_code, s.wholesale_price, s.ram_gb, s.storage_gb, 
    s.color, s.is_active, p.product_id, p.model_name, b.brand_id, b.brand_name;
