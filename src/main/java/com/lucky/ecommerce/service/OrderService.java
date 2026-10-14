package com.lucky.ecommerce.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lucky.ecommerce.dto.OrderRequest;
import com.lucky.ecommerce.dto.OrderItemRequest;

import com.lucky.ecommerce.entity.CustomerOrder;
import com.lucky.ecommerce.entity.OrderItem;
import com.lucky.ecommerce.entity.Product;

import com.lucky.ecommerce.repository.CustomerOrderRepository;
import com.lucky.ecommerce.repository.OrderItemRepository;
import com.lucky.ecommerce.repository.ProductRepository;

@Service
public class OrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    public OrderService(
            CustomerOrderRepository customerOrderRepository,
            OrderItemRepository orderItemRepository,
            ProductRepository productRepository) {

        this.customerOrderRepository = customerOrderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CustomerOrder placeOrder(OrderRequest request) {

        // Step 1: Validate customer details
        if (request == null
                || request.getCustomerName() == null
                || request.getCustomerName().isBlank()
                || request.getEmail() == null
                || request.getEmail().isBlank()
                || request.getAddress() == null
                || request.getAddress().isBlank()) {

            throw new IllegalArgumentException(
                    "Customer name, email and address are required");
        }

        // Step 2: Validate order items
        List<OrderItemRequest> requestedItems = request.getItems();

        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new IllegalArgumentException(
                    "Order must contain at least one product");
        }

        CustomerOrder order = new CustomerOrder();

        order.setCustomerName(request.getCustomerName());
        order.setEmail(request.getEmail());
        order.setAddress(request.getAddress());

        double totalAmount = 0.0;

        List<OrderItem> orderItems = new ArrayList<>();

        // Step 3: Find products and check stock
        for (OrderItemRequest itemRequest : requestedItems) {

            if (itemRequest == null
                    || itemRequest.getProductId() == null
                    || itemRequest.getQuantity() == null
                    || itemRequest.getQuantity() <= 0) {

                throw new IllegalArgumentException(
                        "Valid product ID and positive quantity are required");
            }

            Product product = productRepository
                    .findById(itemRequest.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Product not found: "
                                    + itemRequest.getProductId()));

            if (product.getPrice() == null || product.getPrice() < 0) {
                throw new IllegalArgumentException(
                        "Invalid product price: " + product.getName());
            }

            if (product.getQuantity() == null
                    || product.getQuantity() < itemRequest.getQuantity()) {

                throw new IllegalArgumentException(
                        "Insufficient stock for product: " + product.getName());
            }
            // Step 4: Calculate subtotal using the database price
            double subtotal =
                    product.getPrice() * itemRequest.getQuantity();

            totalAmount += subtotal;

            // Step 5: Create an order item
            OrderItem orderItem = new OrderItem();

            orderItem.setCustomerOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(product.getPrice());

            orderItems.add(orderItem);

            // Step 6: Reduce available stock
            product.setQuantity(
                    product.getQuantity() - itemRequest.getQuantity());

            productRepository.save(product);
        }

        // Step 7: Set the final order amount
        order.setTotalAmount(totalAmount);

        // Step 8: Save the order first
        CustomerOrder savedOrder =
                customerOrderRepository.save(order);

        // Step 9: Save the order items
        for (OrderItem item : orderItems) {
            item.setCustomerOrder(savedOrder);
        }

        orderItemRepository.saveAll(orderItems);

        // Step 10: Return the saved order
        return savedOrder;
    }
}