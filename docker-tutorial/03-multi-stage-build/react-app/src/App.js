import React, { useState } from 'react';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#ffffff',
  padding: '20px',
  boxSizing: 'border-box',
};

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: '40px',
  maxWidth: '600px',
  width: '100%',
  textAlign: 'center',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
};

const titleStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const subtitleStyle = {
  fontSize: '1.1rem',
  opacity: 0.9,
  lineHeight: 1.6,
  marginBottom: '24px',
};

const badgeStyle = {
  display: 'inline-block',
  background: 'rgba(255, 255, 255, 0.25)',
  borderRadius: '20px',
  padding: '8px 20px',
  margin: '4px',
  fontSize: '0.9rem',
  fontWeight: 500,
};

const buttonStyle = {
  background: '#ffffff',
  color: '#764ba2',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 28px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '20px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const infoBoxStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '24px',
  fontSize: '0.85rem',
  opacity: 0.85,
  lineHeight: 1.6,
};

function App() {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🐳</div>
        <h1 style={titleStyle}>React 多阶段构建示例</h1>
        <p style={subtitleStyle}>
          本应用通过 Docker 多阶段构建进行打包。
          <br />
          构建阶段使用 Node.js 编译前端代码，运行阶段使用 Nginx 提供服务。
          <br />
          最终镜像仅约 <strong>25MB</strong>，比单阶段构建缩小了 <strong>95%</strong> 以上。
        </p>

        <div>
          <span style={badgeStyle}>React 18</span>
          <span style={badgeStyle}>Node.js 18</span>
          <span style={badgeStyle}>Nginx Alpine</span>
          <span style={badgeStyle}>Multi-stage Build</span>
        </div>

        <button
          style={buttonStyle}
          onClick={handleClick}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {clickCount === 0 ? '点击试试看' : `已点击 ${clickCount} 次`}
        </button>

        <div style={infoBoxStyle}>
          <strong>构建信息</strong>
          <br />
          构建阶段：node:18-alpine（npm run build）
          <br />
          运行阶段：nginx:alpine（提供静态文件服务）
          <br />
          构建产物：/app/build → /usr/share/nginx/html
        </div>
      </div>
    </div>
  );
}

export default App;
