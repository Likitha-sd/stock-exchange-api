package stock_exchange_api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import stock_exchange_api.engine.Order;
import stock_exchange_api.entity.OrderEntity;
import stock_exchange_api.repository.OrderRepository;

@Service
public class OrderPersistenceService {

    private final OrderRepository orderRepository;

    public OrderPersistenceService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // Save a new order or update an existing order.
    @Transactional
    public void saveOrUpdateOrder(Order order) {

        OrderEntity entity = orderRepository
                .findById(order.getOrderID())
                .orElseGet(OrderEntity::new);

        entity.setOrderID(order.getOrderID());
        entity.setSymbol(order.getSymbol().trim().toUpperCase());
        entity.setSide(order.getSide().toUpperCase());
        entity.setQuantity(order.getQuantity());
        entity.setRemainingQuantity(order.getRemainingQuantity());
        entity.setPriceTicks(order.getPriceTicks());
        entity.setStatus(order.getStatus());

        orderRepository.save(entity);
    }

    // Retrieve an order from PostgreSQL using its ID.
    @Transactional(readOnly = true)
    public OrderEntity getOrderById(int orderID) {

        return orderRepository.findById(orderID).orElse(null);
    }

    // Retrieve all orders stored in PostgreSQL.
    @Transactional(readOnly = true)
    public List<OrderEntity> getAllOrders() {

        return orderRepository.findAll();
    }
}


