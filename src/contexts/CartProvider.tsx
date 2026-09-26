import { useRef, useState, type PropsWithChildren } from "react";
import { useAuth } from "./AuthContext";
import { CartContext, type CartItem } from "./cartContext";

function readCart(key: string): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(saved)) return [];
    const ids = new Set<number>();
    return saved.filter((item): item is CartItem => {
      const p = item?.product;
      if (!p || !Number.isInteger(p.id) || ids.has(p.id) ||
        typeof p.name !== "string" || typeof p.active !== "boolean" ||
        !Number.isFinite(p.price) || p.price < 0 ||
        !Number.isInteger(p.stockQuantity) || p.stockQuantity < 1 ||
        !Number.isFinite(p.weightGrams) ||
        !(p.imageUrl === null || typeof p.imageUrl === "string") ||
        !Number.isInteger(item.quantity) || item.quantity < 1 ||
        item.quantity > p.stockQuantity) return false;
      ids.add(p.id);
      return p.active;
    });
  } catch {
    return [];
  }
}

function AccountCart({ storageKey, children }: PropsWithChildren<{ storageKey: string }>) {
  const [items, setItems] = useState<CartItem[]>(() => readCart(storageKey));
  const itemsRef = useRef(items);
  const [storageError, setStorageError] = useState(false);

  function updateItems(update: (current: CartItem[]) => CartItem[]) {
    const next = update(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  return (
    <CartContext.Provider value={{
      items,
      storageError,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + Math.round(item.product.price * 100) * item.quantity, 0) / 100,
      addItem(product) {
        if (product.id === null || !product.active || product.stockQuantity < 1) return;
        updateItems(current => {
          const existing = current.find(item => item.product.id === product.id);
          if (!existing) return [...current, { product, quantity: 1 }];
          return current.map(item => item.product.id === product.id
            ? { product, quantity: Math.min(item.quantity + 1, product.stockQuantity) }
            : item);
        });
      },
      setQuantity(id, quantity) {
        if (!Number.isInteger(quantity) || quantity < 1) return;
        updateItems(current => current.map(item => item.product.id === id
          ? { ...item, quantity: Math.min(quantity, item.product.stockQuantity) }
          : item));
      },
      removeItem(id) { updateItems(current => current.filter(item => item.product.id !== id)); },
      clearCart() { updateItems(() => []); },
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function CartProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const storageKey = `sujus-cart:${user?.id ?? "guest"}`;
  return <AccountCart key={storageKey} storageKey={storageKey}>{children}</AccountCart>;
}
