
package com.lucky.ecommerce.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lucky.ecommerce.dto.OrderRequest;
import com.lucky.ecommerce.entity.CustomerOrder;
import com.lucky.ecommerce.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(
            @RequestBody OrderRequest request) {

        try {
            CustomerOrder savedOrder =
                    orderService.placeOrder(request);

            Map<String, Object> response = new HashMap<>();

            response.put("message", "Order placed successfully");
            response.put("orderId", savedOrder.getId());
            response.put("customerName",
                    savedOrder.getCustomerName());
            response.put("totalAmount",
                    savedOrder.getTotalAmount());

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (IllegalArgumentException e) {

            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            return ResponseEntity
                    .badRequest()
                    .body(error);
        }
    }
}
