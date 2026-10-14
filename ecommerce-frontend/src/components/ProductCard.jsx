// function ProductCard({ product, onAddToCart }) {

//     return (
//         <div className="product-card">

//             <h2>{product.name}</h2>

//             <p>{product.description}</p>

//             <h3>₹{product.price}</h3>

//             <p>Category: {product.category}</p>

//             <p>Available: {product.quantity}</p>

//             <button onClick={() => onAddToCart(product)}>
//                 Add to Cart
//             </button>

//         </div>
//     );
// }

// export default ProductCard;


function ProductCard({ product, onAddToCart, onEdit, onDelete }) {
  return (
    <div className="product-card">
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <h3>₹{product.price}</h3>
      <p>Category: {product.category}</p>
      <p>Available: {product.quantity}</p>

      <div className="product-actions">
        <button onClick={() => onAddToCart(product)}>
          Add to Cart
        </button>

        <button
          className="edit-btn"
          onClick={() => onEdit(product)}
        >
          Edit
        </button>

        <button
          className="delete-btn"
          onClick={() => onDelete(product.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
