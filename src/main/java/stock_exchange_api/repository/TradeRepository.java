package stock_exchange_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import stock_exchange_api.entity.TradeEntity;

@Repository
public interface TradeRepository
        extends JpaRepository<TradeEntity, String> {
}

