-- ============================================================================
-- 05_functions_triggers.sql: Triggers, Stored Procedures and Stored Functions
-- PRD Section 8 & 8.1
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Trigger: Low-Stock Operational Alert
-- Fires AFTER UPDATE of quantity_on_hand.
-- If quantity_on_hand <= reorder_threshold and no OPEN alert exists for this
-- (warehouse_id, sku_id), creates exactly one OPEN low_stock_alert row.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_inventory_low_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_open_alert_count INT;
BEGIN
    -- Only check if stock has fallen to or below the reorder threshold
    IF NEW.quantity_on_hand <= NEW.reorder_threshold THEN
        -- Check if an OPEN alert already exists for this warehouse and SKU
        SELECT COUNT(*)
        INTO v_open_alert_count
        FROM low_stock_alert
        WHERE warehouse_id = NEW.warehouse_id
          AND sku_id = NEW.sku_id
          AND status = 'OPEN';

        -- Only insert if no active unacknowledged alert is open
        IF v_open_alert_count = 0 THEN
            INSERT INTO low_stock_alert (
                warehouse_id,
                sku_id,
                threshold_value,
                current_quantity,
                status,
                created_at
            ) VALUES (
                NEW.warehouse_id,
                NEW.sku_id,
                NEW.reorder_threshold,
                NEW.quantity_on_hand,
                'OPEN',
                CURRENT_TIMESTAMP
            );
        END IF;
    END IF;

    -- Update inventory timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_low_stock ON inventory;
CREATE TRIGGER trg_check_low_stock
AFTER UPDATE OF quantity_on_hand ON inventory
FOR EACH ROW
EXECUTE FUNCTION fn_inventory_low_stock_alert();


-- ----------------------------------------------------------------------------
-- 2. Stored Function: record_payment()
-- Posts a CREDIT ledger entry, updates outstanding balance, records payment,
-- and updates order payment_status in a single atomic database function.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_payment(
    p_retailer_id INT,
    p_order_id INT,
    p_amount NUMERIC,
    p_payment_method VARCHAR,
    p_reference_no VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    payment_id INT,
    retailer_id INT,
    order_id INT,
    amount NUMERIC,
    new_balance NUMERIC,
    order_payment_status VARCHAR
) AS $$
DECLARE
    v_payment_id INT;
    v_current_balance NUMERIC(12, 2);
    v_new_balance NUMERIC(12, 2);
    v_order_total NUMERIC(12, 2);
    v_total_paid_for_order NUMERIC(12, 2);
    v_new_order_status VARCHAR(30);
BEGIN
    -- Validate payment amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be strictly greater than 0';
    END IF;

    -- Lock and retrieve current retailer balance
    SELECT outstanding_balance
    INTO v_current_balance
    FROM retailer
    WHERE retailer.retailer_id = p_retailer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Retailer ID % not found', p_retailer_id;
    END IF;

    -- Calculate updated balance (cannot go below zero; credit reduces debt)
    v_new_balance := GREATEST(0.00, v_current_balance - p_amount);

    -- Insert payment record
    INSERT INTO payment (
        retailer_id,
        order_id,
        amount,
        payment_method,
        reference_no,
        notes,
        payment_date
    ) VALUES (
        p_retailer_id,
        p_order_id,
        p_amount,
        p_payment_method,
        p_reference_no,
        p_notes,
        CURRENT_TIMESTAMP
    ) RETURNING payment.payment_id INTO v_payment_id;

    -- Update retailer's outstanding balance
    UPDATE retailer
    SET outstanding_balance = v_new_balance
    WHERE retailer.retailer_id = p_retailer_id;

    -- Append immutable CREDIT ledger entry
    INSERT INTO ledger_entry (
        retailer_id,
        entry_type,
        amount,
        balance_after,
        reference_type,
        reference_id,
        notes,
        entry_date
    ) VALUES (
        p_retailer_id,
        'CREDIT',
        p_amount,
        v_new_balance,
        'PAYMENT_RECEIVED',
        v_payment_id,
        COALESCE(p_notes, 'Payment received - ref: ' || p_reference_no),
        CURRENT_TIMESTAMP
    );

    -- If payment is tied to an order, recompute that order's payment status
    IF p_order_id IS NOT NULL THEN
        SELECT total_amount
        INTO v_order_total
        FROM orders
        WHERE orders.order_id = p_order_id;

        IF FOUND THEN
            SELECT COALESCE(SUM(pm.amount), 0.00)
            INTO v_total_paid_for_order
            FROM payment pm
            WHERE pm.order_id = p_order_id;

            IF v_total_paid_for_order >= v_order_total THEN
                v_new_order_status := 'PAID';
            ELSIF v_total_paid_for_order > 0 THEN
                v_new_order_status := 'PARTIALLY_PAID';
            ELSE
                v_new_order_status := 'UNPAID';
            END IF;

            UPDATE orders
            SET payment_status = v_new_order_status
            WHERE orders.order_id = p_order_id;
        END IF;
    END IF;

    RETURN QUERY
    SELECT 
        v_payment_id,
        p_retailer_id,
        p_order_id,
        p_amount,
        v_new_balance,
        v_new_order_status;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 3. Stored Procedure / Function: place_order_transaction()
-- Demonstrates SQL transaction with row locking (SELECT ... FOR UPDATE) in sorted order,
-- stock and credit validations, order insertion, stock decrement, DEBIT ledger entry,
-- and balance update.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION place_order_transaction(
    p_retailer_id INT,
    p_items JSONB,              -- Array of objects: [{"sku_id": 1, "warehouse_id": 2, "quantity": 10}]
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    new_order_id INT,
    order_total NUMERIC,
    new_balance NUMERIC
) AS $$
DECLARE
    v_retailer_credit_limit NUMERIC(12, 2);
    v_retailer_balance NUMERIC(12, 2);
    v_order_total NUMERIC(12, 2) := 0.00;
    v_new_balance NUMERIC(12, 2);
    v_created_order_id INT;
    v_item RECORD;
    v_line_no INT := 0;
    v_sku_price NUMERIC(12, 2);
    v_curr_stock INT;
    v_primary_warehouse_id INT := NULL;
BEGIN
    -- 1. Lock and validate retailer
    SELECT credit_limit, outstanding_balance
    INTO v_retailer_credit_limit, v_retailer_balance
    FROM retailer
    WHERE retailer_id = p_retailer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Retailer % does not exist', p_retailer_id;
    END IF;

    -- 2. Validate and pre-calculate total price
    FOR v_item IN 
        SELECT 
            (elem->>'sku_id')::INT AS sku_id,
            (elem->>'warehouse_id')::INT AS warehouse_id,
            (elem->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items) AS elem
        ORDER BY (elem->>'warehouse_id')::INT, (elem->>'sku_id')::INT -- Locked in sorted order to prevent deadlock
    LOOP
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be strictly greater than 0';
        END IF;

        IF v_primary_warehouse_id IS NULL THEN
            v_primary_warehouse_id := v_item.warehouse_id;
        END IF;

        SELECT wholesale_price INTO v_sku_price
        FROM sku WHERE sku_id = v_item.sku_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'SKU ID % not found', v_item.sku_id;
        END IF;

        v_order_total := v_order_total + (v_sku_price * v_item.quantity);
    END LOOP;

    -- 3. Credit limit check: Reject if balance + order_total > credit_limit
    IF (v_retailer_balance + v_order_total) > v_retailer_credit_limit THEN
        RAISE EXCEPTION 'Order total (₹%) exceeds available credit limit (Limit: ₹%, Current Balance: ₹%)',
            v_order_total, v_retailer_credit_limit, v_retailer_balance;
    END IF;

    -- 4. Create Order Header
    INSERT INTO orders (
        retailer_id,
        order_date,
        status,
        total_amount,
        payment_status,
        shipping_warehouse_id,
        notes
    ) VALUES (
        p_retailer_id,
        CURRENT_TIMESTAMP,
        'PLACED',
        v_order_total,
        'UNPAID',
        v_primary_warehouse_id,
        p_notes
    ) RETURNING order_id INTO v_created_order_id;

    -- 5. Lock inventory rows in sorted order, verify stock, decrement stock, and insert line items
    FOR v_item IN 
        SELECT 
            (elem->>'sku_id')::INT AS sku_id,
            (elem->>'warehouse_id')::INT AS warehouse_id,
            (elem->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items) AS elem
        ORDER BY (elem->>'warehouse_id')::INT, (elem->>'sku_id')::INT
    LOOP
        -- Row lock on inventory
        SELECT quantity_on_hand INTO v_curr_stock
        FROM inventory
        WHERE warehouse_id = v_item.warehouse_id AND sku_id = v_item.sku_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inventory entry not found for warehouse % and SKU %', 
                v_item.warehouse_id, v_item.sku_id;
        END IF;

        IF v_curr_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for SKU % in warehouse %. Available: %, Requested: %',
                v_item.sku_id, v_item.warehouse_id, v_curr_stock, v_item.quantity;
        END IF;

        -- Decrement stock (this will fire the low_stock_alert trigger if threshold reached)
        UPDATE inventory
        SET quantity_on_hand = quantity_on_hand - v_item.quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE warehouse_id = v_item.warehouse_id AND sku_id = v_item.sku_id;

        -- Get current unit price
        SELECT wholesale_price INTO v_sku_price
        FROM sku WHERE sku_id = v_item.sku_id;

        v_line_no := v_line_no + 1;

        -- Insert order line
        INSERT INTO order_item (
            order_id,
            line_no,
            sku_id,
            warehouse_id,
            quantity,
            unit_price
        ) VALUES (
            v_created_order_id,
            v_line_no,
            v_item.sku_id,
            v_item.warehouse_id,
            v_item.quantity,
            v_sku_price
        );
    END LOOP;

    -- 6. Update Retailer Outstanding Balance
    v_new_balance := v_retailer_balance + v_order_total;
    UPDATE retailer
    SET outstanding_balance = v_new_balance
    WHERE retailer_id = p_retailer_id;

    -- 7. Append immutable DEBIT ledger entry
    INSERT INTO ledger_entry (
        retailer_id,
        entry_type,
        amount,
        balance_after,
        reference_type,
        reference_id,
        notes,
        entry_date
    ) VALUES (
        p_retailer_id,
        'DEBIT',
        v_order_total,
        v_new_balance,
        'ORDER_PLACED',
        v_created_order_id,
        'Bulk order placed #' || v_created_order_id,
        CURRENT_TIMESTAMP
    );

    RETURN QUERY
    SELECT v_created_order_id, v_order_total, v_new_balance;
END;
$$ LANGUAGE plpgsql;
