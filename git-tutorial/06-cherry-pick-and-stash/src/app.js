// app.js - 应用主逻辑 / Main Application Logic
// 这个文件会在练习中被多次修改
// This file will be modified multiple times during exercises

/**
 * 应用状态 / Application State
 */
const appState = {
    currentPage: "home",
    theme: "light",
    language: "zh-CN"
};

/**
 * 切换主题 / Toggle Theme
 */
function toggleTheme() {
    appState.theme = appState.theme === "light" ? "dark" : "light";
    document.body.classList.toggle("dark-theme");
    console.log("主题已切换 / Theme toggled:", appState.theme);
}

/**
 * 切换语言 / Toggle Language
 */
function toggleLanguage() {
    appState.language = appState.language === "zh-CN" ? "en" : "zh-CN";
    console.log("语言已切换 / Language toggled:", appState.language);
    // 实际项目中这里会重新渲染页面
    // In a real project, this would re-render the page
}

/**
 * 初始化应用 / Initialize App
 */
function initApp() {
    console.log("MyPortfolio 应用已初始化 / MyPortfolio app initialized");
    console.log("当前状态 / Current state:", appState);

    // 绑定事件 / Bind events
    const themeBtn = document.querySelector("#theme-toggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }
}

document.addEventListener("DOMContentLoaded", initApp);