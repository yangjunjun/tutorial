package com.example;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {
    private Calculator calc;

    @BeforeEach
    void setUp() {
        calc = new Calculator();
    }

    @Test
    void addShouldReturnSum() {
        assertEquals(5, calc.add(2, 3));
    }

    @Test
    void subtractShouldReturnDifference() {
        assertEquals(1, calc.subtract(3, 2));
    }

    @Test
    void multiplyShouldReturnProduct() {
        assertEquals(6, calc.multiply(2, 3));
    }

    @Test
    void divideShouldReturnQuotient() {
        assertEquals(2.5, calc.divide(5, 2));
    }

    @Test
    void divideShouldThrowWhenDivisorIsZero() {
        assertThrows(ArithmeticException.class, () -> calc.divide(1, 0));
    }

    @ParameterizedTest
    @CsvSource({"1,1,2", "0,0,0", "-1,1,0", "100,200,300"})
    void addParameterized(int a, int b, int expected) {
        assertEquals(expected, calc.add(a, b));
    }

    @ParameterizedTest
    @CsvSource({"6,2,3.0", "7,2,3.5", "1,3,0.3333333333333333"})
    void divideParameterized(int a, int b, double expected) {
        assertEquals(expected, calc.divide(a, b), 0.0001);
    }
}
