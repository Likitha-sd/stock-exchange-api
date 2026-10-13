package stock_exchange_api;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import stock_exchange_api.engine.Order;
import stock_exchange_api.engine.OrderBook;
import stock_exchange_api.engine.Trade;
import stock_exchange_api.entity.OrderEntity;
import stock_exchange_api.service.OrderPersistenceService;
import stock_exchange_api.service.TradePersistenceService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderBook orderBook;
    private final OrderPersistenceService orderPersistenceService;
    private final TradePersistenceService tradePersistenceService;

    public OrderController(
            OrderBook orderBook,
            OrderPersistenceService orderPersistenceService,
            TradePersistenceService tradePersistenceService) {

        this.orderBook = orderBook;
        this.orderPersistenceService = orderPersistenceService;
        this.tradePersistenceService = tradePersistenceService;
    }

    // ==========================================
    // SUBMIT A NEW ORDER
    // POST /api/orders
    // ==========================================

    @PostMapping
    public Map<String, Object> submitOrder(
            @Valid @RequestBody OrderRequest request) {

        if (request.getSide() == null
                || (!request.getSide().equalsIgnoreCase("BUY")
                && !request.getSide().equalsIgnoreCase("SELL"))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Side must be BUY or SELL"
            );
        }

        Order order;

        try {
            order = new Order(
                    request.getOrderID(),
                    request.getSymbol(),
                    request.getSide(),
                    request.getQuantity(),
                    request.getPrice()
            );
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    exception.getMessage()
            );
        }

        boolean accepted = orderBook.addOrder(order);

        if (!accepted) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order was rejected. Check the server log for the reason."
            );
        }

        int previousTradeCount = orderBook.getTradeCount();

        orderBook.matchOrders();

        // Persist every order because matching can change multiple orders.
        for (Order currentOrder : orderBook.getOrders()) {
            orderPersistenceService.saveOrUpdateOrder(currentOrder);
        }

        // Persist newly executed trades.
        List<Trade> allTrades = orderBook.getTrades();

        for (int i = previousTradeCount; i < allTrades.size(); i++) {
            tradePersistenceService.saveTrade(allTrades.get(i));
        }

        int tradesExecuted =
                orderBook.getTradeCount() - previousTradeCount;

        return Map.of(
                "message", "Order processed successfully",
                "orderID", order.getOrderID(),
                "symbol", order.getSymbol(),
                "side", order.getSide().toUpperCase(),
                "quantity", order.getQuantity(),
                "price", order.getPrice(),
                "remainingQuantity", order.getRemainingQuantity(),
                "status", order.getStatus().name(),
                "tradesExecuted", tradesExecuted
        );
    }

    // ==========================================
    // GET ALL ORDERS FROM POSTGRESQL
    // GET /api/orders
    // ==========================================

    @GetMapping
    public List<OrderEntity> getAllOrders() {

        return orderPersistenceService.getAllOrders();
    }

    // ==========================================
    // GET AN ORDER BY ID
    // GET /api/orders/{orderID}
    // ==========================================

    @GetMapping("/{orderID}")
    public Map<String, Object> getOrder(
            @PathVariable int orderID) {

        Order order = orderBook.findOrderById(orderID);

        if (order == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Order not found: " + orderID
            );
        }

        int filledQuantity =
                order.getQuantity() - order.getRemainingQuantity();

        return Map.of(
                "orderID", order.getOrderID(),
                "symbol", order.getSymbol(),
                "side", order.getSide().toUpperCase(),
                "quantity", order.getQuantity(),
                "filledQuantity", filledQuantity,
                "remainingQuantity", order.getRemainingQuantity(),
                "price", order.getPrice(),
                "status", order.getStatus().name()
        );
    }

    // ==========================================
    // CANCEL AN ORDER
    // DELETE /api/orders/{orderID}
    // ==========================================

    @DeleteMapping("/{orderID}")
    public Map<String, Object> cancelOrder(
            @PathVariable int orderID) {

        Order order = orderBook.findOrderById(orderID);

        if (order == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Order not found: " + orderID
            );
        }

        boolean cancelled = orderBook.cancelOrder(orderID);

        if (!cancelled) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order cannot be cancelled. It may already be filled or cancelled."
            );
        }

        orderPersistenceService.saveOrUpdateOrder(order);

        return Map.of(
                "message", "Order cancelled successfully",
                "orderID", order.getOrderID(),
                "status", order.getStatus().name(),
                "remainingQuantity", order.getRemainingQuantity()
        );
    }
}

