package stock_exchange_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import stock_exchange_api.engine.OrderBook;

@SpringBootApplication
public class StockExchangeApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockExchangeApiApplication.class, args);
    }

    @Bean
    public OrderBook orderBook() {
        return new OrderBook();
    }
}