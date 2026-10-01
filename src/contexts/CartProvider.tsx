import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import axios from "axios";

import {
  addCartItem,
  deleteCartItem,
  getCart,
  setCartItemQuantity,
} from "../api/cartApi";
import { useAuth } from "./AuthContext";
import {
  CartContext,
  type CartContextValue,
  type CartItem,
} from "./cartContext";
import type { Product } from "../types/Product";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

function getCartError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your sign-in session has expired. Sign in again to load your cart.";
    }
    if (error.response?.status === 403) {
      return "You don’t have permission to access this cart.";
    }
  }
  return getApiErrorMessage(error, "Your cart could not be synchronized. Please try again.");
}

function AccountCart({
  storageKey,
  authenticated,
  children,
}: PropsWithChildren<{ storageKey: string; authenticated: boolean }>) {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef(items);
  const [storageError, setStorageError] = useState(false);
  const [cartStatus, setCartStatus] =
    useState<CartContextValue["cartStatus"]>(
      authenticated ? "loading" : "unauthenticated",
    );
  const [cartError, setCartError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const commitItems = useCallback(
    (next: CartItem[]) => {
      itemsRef.current = next;
      setItems(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    },
    [storageKey],
  );

  const refreshCart = useCallback(async () => {
    if (!authenticated) {
      const error = new Error("Sign in to load your cart.");
      setCartStatus("unauthenticated");
      setCartError(error.message);
      throw error;
    }

    if (mountedRef.current) {
      setCartStatus("loading");
      setCartError(null);
    }
    try {
      const serverItems = await getCart();
      if (mountedRef.current) {
        commitItems(serverItems);
        setCartStatus("ready");
        setCartError(null);
      }
      return serverItems;
    } catch (error) {
      if (mountedRef.current) {
        setCartStatus("error");
        setCartError(getCartError(error));
      }
      throw error;
    }
  }, [authenticated, commitItems]);

  useEffect(() => {
    mountedRef.current = true;
    if (authenticated) {
      void getCart()
        .then((serverItems) => {
          if (!mountedRef.current) return;
          commitItems(serverItems);
          setCartStatus("ready");
          setCartError(null);
        })
        .catch((error: unknown) => {
          if (!mountedRef.current) return;
          setCartStatus("error");
          setCartError(getCartError(error));
        });
    }
    return () => {
      mountedRef.current = false;
    };
  }, [authenticated, commitItems]);

  async function synchronizeMutation(
    mutation: () => Promise<void>,
  ): Promise<void> {
    if (!authenticated) {
      const error = new Error("Sign in to update your cart.");
      setCartStatus("unauthenticated");
      setCartError(error.message);
      throw error;
    }
    try {
      setCartStatus("loading");
      setCartError(null);
      await mutation();
      await refreshCart();
    } catch (error) {
      setCartError(getCartError(error));
      setCartStatus("error");
      throw error;
    }
  }

  const value: CartContextValue = {
    items,
    storageError,
    cartStatus,
    cartError,
    refreshCart,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal:
      items.reduce(
        (total, item) =>
          total + Math.round(item.product.price * 100) * item.quantity,
        0,
      ) / 100,
    addItem(product: Product) {
      if (product.id === null || !product.active || product.stockQuantity < 1) {
        const error = new Error("This product is not available to add to your cart.");
        setCartError(error.message);
        return Promise.reject(error);
      }
      const productId = product.id;
      return synchronizeMutation(() =>
        addCartItem({ productId, quantity: 1 }),
      );
    },
    setQuantity(id, quantity) {
      if (!Number.isInteger(quantity) || quantity < 1) {
        return Promise.reject(new Error("Choose a valid item quantity."));
      }
      const product = itemsRef.current.find((item) => item.product.id === id)?.product;
      if (!product) {
        return Promise.reject(new Error("This product is no longer in your cart."));
      }
      return synchronizeMutation(() =>
        setCartItemQuantity(id, Math.min(quantity, product.stockQuantity)),
      );
    },
    removeItem(id) {
      return synchronizeMutation(() => deleteCartItem(id));
    },
    clearCart() {
      return synchronizeMutation(async () => {
        await Promise.all(
          itemsRef.current.map(({ product }) => {
            if (product.id === null) return Promise.resolve();
            return deleteCartItem(product.id);
          }),
        );
      });
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function CartProvider({ children }: PropsWithChildren) {
  const { user, authenticated } = useAuth();
  const storageKey = `sujus-cart:${user?.id ?? "guest"}`;
  return (
    <AccountCart
      key={storageKey}
      storageKey={storageKey}
      authenticated={authenticated}
    >
      {children}
    </AccountCart>
  );
}
