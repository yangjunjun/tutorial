/**
 * React 应用入口文件
 * 挂载根组件到 DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 获取挂载点
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// 渲染应用
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
