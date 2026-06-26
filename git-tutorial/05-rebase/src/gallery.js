// gallery.js - 图片画廊组件 / Image Gallery Component
// 这个文件将在 rebase 练习中经历多次提交修改
// This file will go through multiple commits during the rebase exercise

/**
 * Gallery 数据 / Gallery Data
 * 模拟从 API 获取的数据 / Simulated API data
 */
const galleryItems = [
    {
        id: 1,
        title: "天气应用 / Weather App",
        image: "images/weather-app.png",
        description: "使用 OpenWeather API 的天气查询应用 / Weather app using OpenWeather API"
    },
    {
        id: 2,
        title: "待办清单 / Todo List",
        image: "images/todo-list.png",
        description: "简洁的待办事项管理工具 / Clean todo management tool"
    },
    {
        id: 3,
        title: "计算器 / Calculator",
        image: "images/calculator.png",
        description: "支持科学计算的在线计算器 / Online calculator with scientific mode"
    }
];

/**
 * 渲染画廊 / Render Gallery
 * @param {HTMLElement} container - 容器元素 / Container element
 */
function renderGallery(container) {
    if (!container) {
        console.error("容器元素不存在 / Container element not found");
        return;
    }

    const fragment = document.createDocumentFragment();

    galleryItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "gallery-card";
        card.innerHTML = `
            <img src="${item.image}" alt="${item.title}" loading="lazy">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        `;
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

// 页面加载后初始化 / Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.querySelector(".project-grid");
    if (gallery) {
        renderGallery(gallery);
    }
});
