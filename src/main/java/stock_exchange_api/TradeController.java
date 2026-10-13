package stock_exchange_api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import stock_exchange_api.entity.TradeEntity;
import stock_exchange_api.service.TradePersistenceService;

@RestController
@RequestMapping("/api/trades")
public class TradeController {

    private final TradePersistenceService tradePersistenceService;

    public TradeController(
            TradePersistenceService tradePersistenceService) {

        this.tradePersistenceService = tradePersistenceService;
    }

    // ==========================================
    // GET ALL TRADES
    // GET /api/trades
    // ==========================================

    @GetMapping
    public List<TradeEntity> getAllTrades() {

        return tradePersistenceService.getAllTrades();
    }

    // ==========================================
    // GET A TRADE BY ID
    // GET /api/trades/{tradeID}
    // ==========================================

    @GetMapping("/{tradeID}")
    public TradeEntity getTradeById(
            @PathVariable String tradeID) {

        TradeEntity trade =
                tradePersistenceService.getTradeById(tradeID);

        if (trade == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Trade not found: " + tradeID
            );
        }

        return trade;
    }
}
