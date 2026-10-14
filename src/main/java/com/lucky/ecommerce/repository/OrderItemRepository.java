
package com.lucky.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lucky.ecommerce.entity.OrderItem;

public interface OrderItemRepository
        extends JpaRepository<OrderItem, Integer> {
}
