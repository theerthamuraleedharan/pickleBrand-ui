import { createContext, useContext } from "react";
import type { Product } from "../types/Product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  storageError: boolean;
  cartStatus: "loading" | "ready" | "error" | "unauthenticated";
  cartError: string | null;
  refreshCart: () => Promise<CartItem[]>;
  addItem: (product: Product) => Promise<void>;
  setQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
