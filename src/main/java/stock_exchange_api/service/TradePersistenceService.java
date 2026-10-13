package stock_exchange_api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import stock_exchange_api.engine.Trade;
import stock_exchange_api.entity.TradeEntity;
import stock_exchange_api.repository.TradeRepository;

@Service
public class TradePersistenceService {

    private final TradeRepository tradeRepository;

    public TradePersistenceService(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    // Save an executed trade to PostgreSQL.
    @Transactional
    public void saveTrade(Trade trade) {

        TradeEntity entity = new TradeEntity();

        entity.setTradeID(trade.getTradeID());
        entity.setBuyOrderID(trade.getBuyOrderID());
        entity.setSellOrderID(trade.getSellOrderID());
        entity.setSymbol(trade.getSymbol());
        entity.setQuantity(trade.getQuantity());
        entity.setPriceTicks(trade.getPriceTicks());
        entity.setTimestamp(trade.getTimestamp());

        tradeRepository.save(entity);
    }

    // Retrieve all executed trades from PostgreSQL.
    @Transactional(readOnly = true)
    public List<TradeEntity> getAllTrades() {

        return tradeRepository.findAll();
    }

    // Retrieve a trade by its ID.
    @Transactional(readOnly = true)
    public TradeEntity getTradeById(String tradeID) {

        return tradeRepository.findById(tradeID).orElse(null);
    }
}
