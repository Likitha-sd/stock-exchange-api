package stock_exchange_api.engine;
import java.math.BigDecimal;

public final class PriceTicks {

    private static final BigDecimal TICKS_PER_UNIT =
            new BigDecimal("100");

    private PriceTicks() {
        // Utility class: no instances required.
    }

    /**
     * Converts a price into integer ticks.
     *
     * One tick represents 0.01 currency units.
     *
     * Example:
     * 100.00 -> 10000
     * 100.01 -> 10001
     */
    public static long toTicks(double price) {

        if (!Double.isFinite(price) || price <= 0) {
            throw new IllegalArgumentException(
                    "Price must be positive and finite."
            );
        }

        try {
            return BigDecimal.valueOf(price)
                    .multiply(TICKS_PER_UNIT)
                    .longValueExact();

        } catch (ArithmeticException exception) {

            throw new IllegalArgumentException(
                    "Price must be a multiple of 0.01.",
                    exception
            );
        }
    }

    /**
     * Converts integer ticks back into a decimal price.
     */
    public static double toPrice(long ticks) {

        if (ticks <= 0) {
            throw new IllegalArgumentException(
                    "Ticks must be positive."
            );
        }

        return BigDecimal.valueOf(ticks)
                .divide(TICKS_PER_UNIT)
                .doubleValue();
    }
}