package stock_exchange_api.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trades")
public class TradeEntity {

    @Id
    @Column(name = "trade_id", nullable = false, length = 80)
    private String tradeID;

    @Column(name = "buy_order_id", nullable = false)
    private Integer buyOrderID;

    @Column(name = "sell_order_id", nullable = false)
    private Integer sellOrderID;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "price_ticks", nullable = false)
    private Long priceTicks;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public TradeEntity() {
        // Required by JPA.
    }

    public String getTradeID() {
        return tradeID;
    }

    public void setTradeID(String tradeID) {
        this.tradeID = tradeID;
    }

    public Integer getBuyOrderID() {
        return buyOrderID;
    }

    public void setBuyOrderID(Integer buyOrderID) {
        this.buyOrderID = buyOrderID;
    }

    public Integer getSellOrderID() {
        return sellOrderID;
    }

    public void setSellOrderID(Integer sellOrderID) {
        this.sellOrderID = sellOrderID;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Long getPriceTicks() {
        return priceTicks;
    }

    public void setPriceTicks(Long priceTicks) {
        this.priceTicks = priceTicks;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

