package stock_exchange_api.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import stock_exchange_api.engine.Order;
import stock_exchange_api.engine.OrderBook;
import stock_exchange_api.entity.OrderEntity;

@Component
public class OrderBookRecovery implements ApplicationRunner {

private final OrderBook orderBook;
private final OrderPersistenceService orderPersistenceService;

public OrderBookRecovery(
        OrderBook orderBook,
        OrderPersistenceService orderPersistenceService) {
    this.orderBook = orderBook;
    this.orderPersistenceService = orderPersistenceService;
}

@Override
public void run(ApplicationArguments args) {

    System.out.println("Starting order book recovery...");

    List<OrderEntity> savedOrders =
            new ArrayList<>(orderPersistenceService.getAllOrders());

    // Restore in ascending order ID as a deterministic fallback.
    // Exact original arrival priority is not persisted yet.
    savedOrders.sort(
            Comparator.comparing(OrderEntity::getOrderID)
    );

    int restoredCount = 0;
    int skippedCount = 0;

    for (OrderEntity entity : savedOrders) {

        Order.Status status = entity.getStatus();

        // Only orders that can still participate in matching
        // belong in the active order book.
        if (status != Order.Status.OPEN
                && status != Order.Status.PARTIALLY_FILLED) {
            continue;
        }

        Order order = new Order(
                entity.getOrderID(),
                entity.getSymbol(),
                entity.getSide(),
                entity.getQuantity(),
                entity.getRemainingQuantity(),
                entity.getPriceTicks(),
                status
        );

        if (orderBook.restoreOrder(order)) {
            restoredCount++;
        } else {
            skippedCount++;

            System.err.println(
                    "Could not restore order ID: "
                            + entity.getOrderID()
            );
        }
    }

    System.out.println("Order book recovery completed.");
    System.out.println("Active orders restored: " + restoredCount);
    System.out.println("Active orders skipped: " + skippedCount);
}

}
