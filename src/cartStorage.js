const CART_KEY = "snadai_cart";

export function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCart(item) {
  const items = getCartItems();
  const next = items.some((i) => i.id === item.id)
    ? items
    : [...items, item];
  localStorage.setItem(CART_KEY, JSON.stringify(next));
  return next;
}

export function removeFromCart(id) {
  const next = getCartItems().filter((i) => i.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(next));
  return next;
}
