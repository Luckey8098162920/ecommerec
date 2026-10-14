package com.lucky.ecommerce.service;


import java.util.List;

import com.lucky.ecommerce.entity.Product;


public interface ProductService {

    Product addProduct(Product product);

    List<Product> getAllProducts();

    Product getProductById(Integer id);

    Product updateProduct(Integer id, Product product);

    void deleteProduct(Integer id);
}