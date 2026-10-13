package stock_exchange_api.engine;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class Trade {


private final String tradeID;
private final int buyOrderID;
private final int sellOrderID;
private final String symbol;
private final int quantity;

// Exact execution price representation.
private final long priceTicks;

private final LocalDateTime timestamp;

private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

// Constructor used by the existing OrderBook.
public Trade(
        int buyOrderID,
        int sellOrderID,
        String symbol,
        int quantity,
        double executionPrice
) {
    this(
            buyOrderID,
            sellOrderID,
            symbol,
            quantity,
            PriceTicks.toTicks(executionPrice)
    );
}

// Constructor for exact integer-tick prices.
public Trade(
        int buyOrderID,
        int sellOrderID,
        String symbol,
        int quantity,
        long executionPriceTicks
) {
    if (quantity <= 0) {
        throw new IllegalArgumentException(
                "Trade quantity must be positive."
        );
    }

    if (executionPriceTicks <= 0) {
        throw new IllegalArgumentException(
                "Execution price must be positive."
        );
    }

    // Unique identifier that does not reset when the application restarts.
    this.tradeID = "T-" + UUID.randomUUID();

    this.buyOrderID = buyOrderID;
    this.sellOrderID = sellOrderID;
    this.symbol = symbol;
    this.quantity = quantity;
    this.priceTicks = executionPriceTicks;
    this.timestamp = LocalDateTime.now();
}

public String getTradeID() {
    return tradeID;
}

public int getBuyOrderID() {
    return buyOrderID;
}

public int getSellOrderID() {
    return sellOrderID;
}

public String getSymbol() {
    return symbol;
}

public int getQuantity() {
    return quantity;
}

public long getPriceTicks() {
    return priceTicks;
}

public double getTradePrice() {
    return PriceTicks.toPrice(priceTicks);
}

public LocalDateTime getTimestamp() {
    return timestamp;
}

// Calculate the trade value using decimal arithmetic.
public BigDecimal getTradeValueExact() {
    BigDecimal executionPrice = BigDecimal.valueOf(priceTicks, 2);

    return executionPrice.multiply(
            BigDecimal.valueOf(quantity)
    );
}

// Retained for compatibility with existing tests.
public double getTradeValue() {
    return getTradeValueExact().doubleValue();
}

public void displayTrade() {
    System.out.println("Trade ID: " + tradeID);
    System.out.println("Buy Order ID: " + buyOrderID);
    System.out.println("Sell Order ID: " + sellOrderID);
    System.out.println("Stock: " + symbol);
    System.out.println("Quantity: " + quantity);

    System.out.println(
            "Execution Price: "
                    + String.format(
                            java.util.Locale.ROOT,
                            "%.2f",
                            getTradePrice()
                    )
    );

    System.out.println(
            "Trade Value: "
                    + getTradeValueExact().toPlainString()
    );

    System.out.println(
            "Execution Timestamp: "
                    + timestamp.format(FORMATTER)
    );

    System.out.println("--------------------------------");
}

}
