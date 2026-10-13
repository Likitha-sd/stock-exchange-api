package stock_exchange_api.engine;

public class Order {

    public enum Status {
        OPEN,
        PARTIALLY_FILLED,
        FILLED,
        CANCELLED
    }

    int orderID;
    String symbol;
    String side;

    int quantity;
    int remainingQuantity;

    // Decimal representation retained for compatibility.
    double price;

    // Exact representation: 1 tick = 0.01 currency units.
    long priceTicks;

    Status status;

    // Constructor for a brand-new order.
    public Order(
            int orderID,
            String symbol,
            String side,
            int quantity,
            double price
    ) {

        this.orderID = orderID;
        this.symbol = symbol;
        this.side = side;
        this.quantity = quantity;

        this.remainingQuantity = quantity;

        // Validate and convert the price.
        this.priceTicks = PriceTicks.toTicks(price);
        this.price = PriceTicks.toPrice(this.priceTicks);

        this.status = Status.OPEN;
    }

    // Constructor for restoring an existing order.
    public Order(
            int orderID,
            String symbol,
            String side,
            int quantity,
            int remainingQuantity,
            long priceTicks,
            Status status
    ) {

        this.orderID = orderID;
        this.symbol = symbol;
        this.side = side;
        this.quantity = quantity;
        this.remainingQuantity = remainingQuantity;

        this.priceTicks = priceTicks;
        this.price = PriceTicks.toPrice(priceTicks);

        this.status = status;
    }

    // Getters
    public int getOrderID() {
        return orderID;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getSide() {
        return side;
    }

    public int getQuantity() {
        return quantity;
    }

    public int getRemainingQuantity() {
        return remainingQuantity;
    }

    public double getPrice() {
        return price;
    }

    public long getPriceTicks() {
        return priceTicks;
    }

    public Status getStatus() {
        return status;
    }
}