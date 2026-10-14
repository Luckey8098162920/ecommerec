
package com.lucky.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lucky.ecommerce.entity.CustomerOrder;

public interface CustomerOrderRepository
        extends JpaRepository<CustomerOrder, Integer> {
}
