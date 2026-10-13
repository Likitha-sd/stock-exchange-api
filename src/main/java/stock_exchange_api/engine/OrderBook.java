package stock_exchange_api.engine;

import java.math.BigDecimal;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class OrderBook {

    // Store all submitted orders and executed trades.
    private final List<Order> orders = new ArrayList<>();
    private final List<Trade> trades = new ArrayList<>();

    // Track arrival order for price-time priority.
    private final Map<Integer, Long> arrivalSequence = new HashMap<>();

    // Separate order books for BUY and SELL orders.
    private final Map<String, TreeMap<Long, Deque<Order>>> buyBooks =
            new HashMap<>();

    private final Map<String, TreeMap<Long, Deque<Order>>> sellBooks =
            new HashMap<>();

    private long nextArrivalSequence = 1;

    // ==========================================
    // ADD A NEW ORDER
    // ==========================================

    public synchronized boolean addOrder(Order order) {

        if (order == null) {
            return false;
        }

        if (order.getOrderID() <= 0
                || order.getSymbol() == null
                || order.getSymbol().isBlank()
                || order.getSide() == null
                || order.getQuantity() <= 0
                || order.getPriceTicks() <= 0) {
            return false;
        }

        if (!order.getSide().equalsIgnoreCase("BUY")
                && !order.getSide().equalsIgnoreCase("SELL")) {
            return false;
        }

        // Reject duplicate order IDs.
        if (findOrderById(order.getOrderID()) != null) {
            return false;
        }

        orders.add(order);

        arrivalSequence.put(
                order.getOrderID(),
                nextArrivalSequence++
        );

        addToBook(order);

        return true;
    }

    // ==========================================
    // ADD ORDER TO THE APPROPRIATE BOOK
    // ==========================================

    private void addToBook(Order order) {

        String symbol = order.getSymbol().trim().toUpperCase();

        if (order.getSide().equalsIgnoreCase("BUY")) {

            // Highest BUY price gets priority.
            TreeMap<Long, Deque<Order>> book =
                    buyBooks.computeIfAbsent(
                            symbol,
                            key -> new TreeMap<>(Comparator.reverseOrder())
                    );

            // At the same price, earlier orders have priority.
            book.computeIfAbsent(
                    order.getPriceTicks(),
                    key -> new ArrayDeque<>()
            ).addLast(order);

        } else {

            // Lowest SELL price gets priority.
            TreeMap<Long, Deque<Order>> book =
                    sellBooks.computeIfAbsent(
                            symbol,
                            key -> new TreeMap<>()
                    );

            book.computeIfAbsent(
                    order.getPriceTicks(),
                    key -> new ArrayDeque<>()
            ).addLast(order);
        }
    }

    // ==========================================
    // MATCH ALL ELIGIBLE ORDERS
    // ==========================================

    public synchronized void matchOrders() {

        List<String> symbols = new ArrayList<>(buyBooks.keySet());

        for (String symbol : symbols) {
            matchSymbol(symbol);
        }
    }

    // ==========================================
    // MATCH ORDERS FOR ONE SYMBOL
    // ==========================================

    private void matchSymbol(String symbol) {

        TreeMap<Long, Deque<Order>> buyBook = buyBooks.get(symbol);
        TreeMap<Long, Deque<Order>> sellBook = sellBooks.get(symbol);

        if (buyBook == null || sellBook == null) {
            return;
        }

        while (!buyBook.isEmpty() && !sellBook.isEmpty()) {

            Map.Entry<Long, Deque<Order>> bestBuyEntry =
                    buyBook.firstEntry();

            Map.Entry<Long, Deque<Order>> bestSellEntry =
                    sellBook.firstEntry();

            // No match when the highest BUY price is below
            // the lowest SELL price.
            if (bestBuyEntry.getKey() < bestSellEntry.getKey()) {
                break;
            }

            Order buyOrder = bestBuyEntry.getValue().peekFirst();
            Order sellOrder = bestSellEntry.getValue().peekFirst();

            if (buyOrder == null || sellOrder == null) {
                break;
            }

            int tradedQuantity = Math.min(
                    buyOrder.getRemainingQuantity(),
                    sellOrder.getRemainingQuantity()
            );

            // Determine the execution price using the earlier
            // of the two orders.
            long buySequence =
                    arrivalSequence.getOrDefault(
                            buyOrder.getOrderID(),
                            Long.MAX_VALUE
                    );

            long sellSequence =
                    arrivalSequence.getOrDefault(
                            sellOrder.getOrderID(),
                            Long.MAX_VALUE
                    );

            long executionPriceTicks;

            if (buySequence < sellSequence) {
                executionPriceTicks = buyOrder.getPriceTicks();
            } else {
                executionPriceTicks = sellOrder.getPriceTicks();
            }

            // Create a trade for the matched quantities.
            Trade trade = new Trade(
                    buyOrder.getOrderID(),
                    sellOrder.getOrderID(),
                    symbol,
                    tradedQuantity,
                    executionPriceTicks
            );

            trades.add(trade);

            // Update the remaining quantities.
            buyOrder.remainingQuantity -= tradedQuantity;
            sellOrder.remainingQuantity -= tradedQuantity;

            // Update both order statuses.
            updateOrderStatus(buyOrder);
            updateOrderStatus(sellOrder);

            // Remove completely filled orders from their queues.
            if (buyOrder.getRemainingQuantity() == 0) {
                bestBuyEntry.getValue().removeFirst();
            }

            if (sellOrder.getRemainingQuantity() == 0) {
                bestSellEntry.getValue().removeFirst();
            }

            // Remove empty price levels.
            if (bestBuyEntry.getValue().isEmpty()) {
                buyBook.remove(bestBuyEntry.getKey());
            }

            if (bestSellEntry.getValue().isEmpty()) {
                sellBook.remove(bestSellEntry.getKey());
            }
        }

        // Remove empty symbol books.
        if (buyBook.isEmpty()) {
            buyBooks.remove(symbol);
        }

        if (sellBook.isEmpty()) {
            sellBooks.remove(symbol);
        }
    }

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    private void updateOrderStatus(Order order) {

        if (order.getRemainingQuantity() == 0) {

            order.status = Order.Status.FILLED;

        } else if (order.getRemainingQuantity() < order.getQuantity()) {

            order.status = Order.Status.PARTIALLY_FILLED;

        } else {

            order.status = Order.Status.OPEN;
        }
    }

    // ==========================================
    // CANCEL AN ORDER
    // ==========================================

    public synchronized boolean cancelOrder(int orderID) {

        Order order = findOrderById(orderID);

        if (order == null) {
            return false;
        }

        if (order.getStatus() == Order.Status.FILLED
                || order.getStatus() == Order.Status.CANCELLED) {
            return false;
        }

        removeFromBook(order);

        order.remainingQuantity = 0;
        order.status = Order.Status.CANCELLED;

        return true;
    }

    // ==========================================
    // REMOVE ORDER FROM ITS BOOK
    // ==========================================

    private void removeFromBook(Order order) {

        String symbol = order.getSymbol().trim().toUpperCase();

        Map<String, TreeMap<Long, Deque<Order>>> books =
                order.getSide().equalsIgnoreCase("BUY")
                        ? buyBooks
                        : sellBooks;

        TreeMap<Long, Deque<Order>> book = books.get(symbol);

        if (book == null) {
            return;
        }

        Deque<Order> queue = book.get(order.getPriceTicks());

        if (queue != null) {

            queue.remove(order);

            if (queue.isEmpty()) {
                book.remove(order.getPriceTicks());
            }
        }

        if (book.isEmpty()) {
            books.remove(symbol);
        }
    }

    // ==========================================
    // FIND AN ORDER BY ID
    // ==========================================

    public synchronized Order findOrderById(int orderID) {

        for (Order order : orders) {

            if (order.getOrderID() == orderID) {
                return order;
            }
        }

        return null;
    }

    // ==========================================
    // GET ALL ORDERS
    // REQUIRED BY OrderController
    // ==========================================

    public synchronized List<Order> getOrders() {

        return Collections.unmodifiableList(
                new ArrayList<>(orders)
        );
    }

    // ==========================================
    // GET ALL TRADES
    // ==========================================

    public synchronized List<Trade> getTrades() {

        return Collections.unmodifiableList(
                new ArrayList<>(trades)
        );
    }

    // ==========================================
    // GET TRADE COUNT
    // ==========================================

    public synchronized int getTradeCount() {
        return trades.size();
    }

    // ==========================================
    // CALCULATE TOTAL TRADED VALUE
    // ==========================================

    public synchronized BigDecimal getTotalTradedValueExact() {

        BigDecimal total = BigDecimal.ZERO;

        for (Trade trade : trades) {
            total = total.add(trade.getTradeValueExact());
        }

        return total;
    }

    public synchronized double getTotalTradedValue() {

        return getTotalTradedValueExact().doubleValue();
    }

    // ==========================================
    // ==========================================
    // RESTORE AN EXISTING ACTIVE ORDER
    // ==========================================

    public synchronized boolean restoreOrder(Order order) {

        if (order == null) {
            return false;
        }

        if (order.getStatus() != Order.Status.OPEN
                && order.getStatus() != Order.Status.PARTIALLY_FILLED) {
            return false;
        }

        if (order.getOrderID() <= 0
                || order.getSymbol() == null
                || order.getSymbol().isBlank()
                || order.getSide() == null
                || order.getQuantity() <= 0
                || order.getRemainingQuantity() <= 0
                || order.getRemainingQuantity() > order.getQuantity()
                || order.getPriceTicks() <= 0) {
            return false;
        }

        if (!order.getSide().equalsIgnoreCase("BUY")
                && !order.getSide().equalsIgnoreCase("SELL")) {
            return false;
        }

        // Prevent duplicate order IDs.
        if (findOrderById(order.getOrderID()) != null) {
            return false;
        }

        // Add the order to the in-memory order collection.
        orders.add(order);

        // Assign a sequence for matching after recovery.
        arrivalSequence.put(
                order.getOrderID(),
                nextArrivalSequence++
        );

        // Reuse the existing method to rebuild the correct book.
        addToBook(order);

        System.out.println(
                "Recovered order " + order.getOrderID()
                        + ", symbol: " + order.getSymbol()
                        + ", remaining quantity: " + order.getRemainingQuantity()
                        + ", status: " + order.getStatus()
        );

        return true;
    }
    // DISPLAY ORDERS
    // ==========================================

    public synchronized void displayOrders() {

        for (Order order : orders) {

            System.out.println(
                    "Order ID: " + order.getOrderID()
                            + ", Symbol: " + order.getSymbol()
                            + ", Side: " + order.getSide()
                            + ", Quantity: " + order.getQuantity()
                            + ", Remaining: " + order.getRemainingQuantity()
                            + ", Price: " + order.getPrice()
                            + ", Status: " + order.getStatus()
            );
        }
    }

    // ==========================================
    // DISPLAY TRADES
    // ==========================================

    public synchronized void displayTrades() {

        for (Trade trade : trades) {
            trade.displayTrade();
        }
    }
}
