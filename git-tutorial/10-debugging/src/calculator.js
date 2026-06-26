// calculator.js - 在线计算器 / Online Calculator
// 这个文件有一个隐藏的 bug，使用 git bisect 来找到它！
// This file has a hidden bug — use git bisect to find it!

/**
 * 计算器状态 / Calculator State
 */
let currentInput = "0";
let previousInput = "";
let operator = null;
let shouldResetDisplay = false;

/**
 * 输入数字或运算符 / Input number or operator
 * @param {string} value - 输入值 / Input value
 */
function calcInput(value) {
    const display = document.getElementById("display");

    if (["+", "-", "*", "/"].includes(value)) {
        // 设置运算符 / Set operator
        operator = value;
        previousInput = currentInput;
        shouldResetDisplay = true;
        display.textContent = currentInput + " " + getOperatorSymbol(value);
        return;
    }

    if (shouldResetDisplay) {
        currentInput = "";
        shouldResetDisplay = false;
    }

    // BUG: 这里把 '0' 开头的数字字符串当作八进制处理了
    // BUG: Numbers starting with '0' are treated as octal here
    if (currentInput === "0" && value !== ".") {
        currentInput = value;
    } else {
        currentInput += value;
    }

    display.textContent = currentInput;
}

/**
 * 计算结果 / Calculate result
 */
function calcEquals() {
    const display = document.getElementById("display");

    if (!operator || !previousInput) return;

    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput);
    let result;

    switch (operator) {
        case "+":
            result = add(prev, curr);
            break;
        case "-":
            result = subtract(prev, curr);
            break;
        case "*":
            result = multiply(prev, curr);
            break;
        case "/":
            result = divide(prev, curr);
            break;
        default:
            result = curr;
    }

    display.textContent = result;
    currentInput = String(result);
    operator = null;
    previousInput = "";
    shouldResetDisplay = true;
}

/**
 * 加法 / Addition
 * ⚠️ 这个函数有一个 bug！用 git bisect 找到它！
 * ⚠️ This function has a bug! Use git bisect to find it!
 */
function add(a, b) {
    // BUG: 使用了字符串拼接而不是数学加法
    // BUG: String concatenation instead of mathematical addition
    return a + b;  // 当 a 或 b 是字符串时会出问题 / Problematic when a or b is a string
}

/**
 * 减法 / Subtraction
 */
function subtract(a, b) {
    return a - b;
}

/**
 * 乘法 / Multiplication
 */
function multiply(a, b) {
    return a * b;
}

/**
 * 除法 / Division
 */
function divide(a, b) {
    if (b === 0) {
        return "错误：除数不能为零 / Error: Division by zero";
    }
    return a / b;
}

/**
 * 清除计算器 / Clear calculator
 */
function calcClear() {
    const display = document.getElementById("display");
    currentInput = "0";
    previousInput = "";
    operator = null;
    shouldResetDisplay = false;
    display.textContent = "0";
}

/**
 * 获取运算符符号 / Get operator display symbol
 */
function getOperatorSymbol(op) {
    const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    return symbols[op] || op;
}
