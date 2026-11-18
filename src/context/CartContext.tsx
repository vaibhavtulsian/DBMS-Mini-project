'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  sku_id: number;
  product_id: number;
  model_name: string;
  brand_name: string;
  sku_code: string;
  ram_gb: number;
  storage_gb: number;
  color: string;
  wholesale_price: number;
  quantity: number;
  warehouse_id?: number;
  warehouse_name?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (skuId: number) => void;
  updateQuantity: (skuId: number, quantity: number) => void;
  updateWarehouse: (skuId: number, warehouseId: number, warehouseName?: string) => void;
  clearCart: () => void;
  totalUnits: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('b2b_wholesale_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem('b2b_wholesale_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 10) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sku_id === item.sku_id);
      if (existing) {
        return prev.map((i) =>
          i.sku_id === item.sku_id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (skuId: number) => {
    setItems((prev) => prev.filter((i) => i.sku_id !== skuId));
  };

  const updateQuantity = (skuId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(skuId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.sku_id === skuId ? { ...i, quantity } : i))
    );
  };

  const updateWarehouse = (skuId: number, warehouseId: number, warehouseName?: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.sku_id === skuId
          ? { ...i, warehouse_id: warehouseId, warehouse_name: warehouseName }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.wholesale_price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateWarehouse,
        clearCart,
        totalUnits,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
