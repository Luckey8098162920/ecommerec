package com.lucky.ecommerce.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.lucky.ecommerce.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Integer> {

}
