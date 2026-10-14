
import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "./components/ProductCard";
import "./App.css";

const API_URL = "http://localhost:8888/products";
const ORDER_API_URL = "http://localhost:8888/api/orders";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  quantity: "",
  category: "",
};

const EMPTY_CHECKOUT = {
  customerName: "",
  email: "",
  address: "",
};

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Add/Edit product states
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Checkout states
  const [checkout, setCheckout] = useState({ ...EMPTY_CHECKOUT });
  const [placingOrder, setPlacingOrder] = useState(false);

  // 1. Load products when the page opens
  useEffect(() => {
    getProducts();
  }, []);

  // 2. Get products from Spring Boot
  const getProducts = async () => {
    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (error) {
      console.error("Error getting products:", error);
      setMessage("Could not load products. Check the backend.");
    }
  };

  // 3. Handle product form input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // 4. Add a new product or update an existing product
  const handleSubmit = async (event) => {
    event.preventDefault();

    const price = Number(formData.price);
    const quantity = Number(formData.quantity);

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.category.trim() ||
      formData.price.trim() === "" ||
      formData.quantity.trim() === ""
    ) {
      setMessage("Please fill in all product fields.");
      return;
    }

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(quantity) ||
      price < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setMessage("Enter a valid price and a whole-number quantity.");
      return;
    }

    const newProduct = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      quantity,
      category: formData.category.trim(),
    };

    try {
      setSaving(true);
      setMessage("");

      if (editingId !== null) {
        await axios.put(`${API_URL}/${editingId}`, newProduct);
        setMessage("Product updated successfully!");
      } else {
        await axios.post(API_URL, newProduct);
        setMessage("Product added successfully!");
      }

      setFormData({ ...EMPTY_FORM });
      setEditingId(null);

      await getProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to save product. Check the backend."
      );
    } finally {
      setSaving(false);
    }
  };

  // 5. Load a selected product into the form for editing
  const handleEdit = (product) => {
    setEditingId(product.id);

    setFormData({
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      quantity: String(product.quantity ?? ""),
      category: product.category ?? "",
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 6. Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setMessage("");
  };

  // 7. Delete a product
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/${id}`);

      setProducts((previousProducts) =>
        previousProducts.filter((product) => product.id !== id)
      );

      setCart((previousCart) =>
        previousCart.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        cancelEdit();
      }

      setMessage("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to delete product. Check the backend."
      );
    }
  };

  // 8. Add a product to the cart
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      setMessage("This product is out of stock.");
      return;
    }

    setCart((previousCart) => {
      const existing = previousCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.cartQuantity >= product.quantity) {
          setMessage("You cannot add more than the available stock.");
          return previousCart;
        }

        return previousCart.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }

      return [...previousCart, { ...product, cartQuantity: 1 }];
    });

    setMessage("");
  };

  // 9. Increase or decrease cart quantity
  const changeQuantity = (id, amount) => {
    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (item.id !== id) return item;

          const nextQuantity = item.cartQuantity + amount;

          if (nextQuantity > item.quantity) {
            setMessage("You cannot exceed the available stock.");
            return item;
          }

          return {
            ...item,
            cartQuantity: nextQuantity,
          };
        })
        .filter((item) => item.cartQuantity > 0)
    );
  };

  // 10. Remove an item from the cart
  const removeFromCart = (id) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== id)
    );
  };

  // 11. Place an order through Spring Boot
  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (placingOrder) return;

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (
      !checkout.customerName.trim() ||
      !checkout.email.trim() ||
      !checkout.address.trim()
    ) {
      setMessage("Please fill in all checkout details.");
      return;
    }

    // Prepare the request for OrderRequest.java
    const orderRequest = {
      customerName: checkout.customerName.trim(),
      email: checkout.email.trim(),
      address: checkout.address.trim(),
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.cartQuantity,
      })),
    };

    try {
      setPlacingOrder(true);
      setMessage("");

      const response = await axios.post(
        ORDER_API_URL,
        orderRequest
      );

      // Clear cart and checkout only after successful order creation
      setCart([]);
      setCheckout({ ...EMPTY_CHECKOUT });

      setMessage(
        `Order placed successfully! Order ID: ${response.data.orderId}`
      );

      // Refresh product stock from the database
      await getProducts();
    } catch (error) {
      console.error("Checkout error:", error);

      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Order failed. Please check the backend and try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // 12. Search and category filter
  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  // Available categories
  const categories = [
    "All",
    ...new Set(
      products.map((product) => product.category).filter(Boolean)
    ),
  ];

  // Total cart items
  const totalItems = cart.reduce(
    (total, item) => total + item.cartQuantity,
    0
  );

  // Display total (the backend calculates the final order total)
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0
  );

  return (
    <div className="app">
      <header className="store-header">
        <h1>My E-Commerce Store</h1>
        <div className="cart">🛒 Cart: {totalItems}</div>
      </header>

      <main className="store-main">
        {/* Add/Edit Product Form */}
        <section className="add-product-section">
          <h2>
            {editingId !== null ? "Edit Product" : "Add New Product"}
          </h2>

          <form className="product-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Product name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />

            <textarea
              name="description"
              placeholder="Product description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />

            <input
              type="number"
              name="price"
              placeholder="Price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              required
            />

            <input
              type="number"
              name="quantity"
              placeholder="Available quantity"
              min="0"
              step="1"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />

            <input
              type="text"
              name="category"
              placeholder="Category (e.g. Electronics)"
              value={formData.category}
              onChange={handleInputChange}
              required
            />

            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Product"
                  : "Add Product"}
            </button>

            {editingId !== null && (
              <button type="button" onClick={cancelEdit}>
                Cancel Edit
              </button>
            )}
          </form>

          {message && <p role="status">{message}</p>}
        </section>

        {/* Product List */}
        <section className="product-list-section">
          <h2>Products</h2>

          <div className="filters">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button type="button" onClick={getProducts}>
              Refresh Products
            </button>
          </div>

          <div className="products-container">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <p>No products found.</p>
            )}
          </div>
        </section>

        {/* Shopping Cart and Checkout */}
        <section className="cart-section">
          <h2>Your Shopping Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      ₹{Number(item.price).toFixed(2)} ×{" "}
                      {item.cartQuantity}
                    </p>
                  </div>

                  <div className="cart-actions">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, -1)}
                    >
                      −
                    </button>

                    <span>{item.cartQuantity}</span>

                    <button
                      type="button"
                      disabled={item.cartQuantity >= item.quantity}
                      onClick={() => changeQuantity(item.id, 1)}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <h3>Total: ₹{totalPrice.toFixed(2)}</h3>

              {/* Checkout Form */}
              <h3>Checkout Details</h3>

              <form
                className="product-form"
                onSubmit={handlePlaceOrder}
              >
                <input
                  type="text"
                  placeholder="Customer name"
                  value={checkout.customerName}
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      customerName: event.target.value,
                    }))
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Email address"
                  value={checkout.email}
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  required
                />

                <textarea
                  placeholder="Delivery address"
                  value={checkout.address}
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      address: event.target.value,
                    }))
                  }
                  required
                />

                <button
                  type="submit"
                  disabled={placingOrder || cart.length === 0}
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>
              </form>
            </>
          )}

          {message && <p role="status">{message}</p>}
        </section>
      </main>
    </div>
  );
}

export default App;
