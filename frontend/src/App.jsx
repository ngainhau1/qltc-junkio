import { useState, useEffect } from 'react'

function App() {
  const [backendMessage, setBackendMessage] = useState('Đang kết nối Backend...')
  const [count, setCount] = useState(0)

  // Gọi API thử ngay khi mở trang
  useEffect(() => {
    fetch('http://localhost:5000/') // Gọi về Backend đang chạy port 5000
      .then(response => response.text())
      .then(data => setBackendMessage(data))
      .catch(err => setBackendMessage('❌ Không kết nối được Backend: ' + err.message))
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      {/* Phần 1: Kiểm tra giao diện React */}
      <h1>🚀 Junkio Expense Tracker</h1>
      <h2 style={{ color: 'green' }}>Frontend (React) đã hoạt động!</h2>
      
      {/* Phần 2: Kiểm tra chức năng tương tác (State) */}
      <div style={{ padding: '20px', border: '1px solid #ccc', display: 'inline-block', borderRadius: '10px' }}>
        <p>Thử bấm nút để kiểm tra tính năng tương tác:</p>
        <button 
          onClick={() => setCount(count + 1)}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Số lần bấm: {count}
        </button>
      </div>

      <br /><br />

      {/* Phần 3: Kiểm tra kết nối Backend */}
      <div style={{ marginTop: '20px', color: '#555' }}>
        <h3>Trạng thái Backend:</h3>
        {/* Render nội dung HTML trả về từ Backend */}
        <div dangerouslySetInnerHTML={{ __html: backendMessage }} />
      </div>
    </div>
  )
}

export default App