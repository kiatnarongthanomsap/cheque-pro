import React, { useState, useEffect } from 'react';
import ChequePrinter from './ChequePrinter';
import LineCallback from './LineCallback';

function App() {
  const [isLineCallback, setIsLineCallback] = useState(false);
  const [lineUserInfo, setLineUserInfo] = useState(null);

  useEffect(() => {
    // ตรวจสอบว่าอยู่ในหน้า callback หรือไม่
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      setIsLineCallback(true);
    }

    // ตรวจสอบว่ามีข้อมูลผู้ใช้จาก Line Login ที่เก็บไว้หรือไม่
    const savedLineUser = sessionStorage.getItem('line_login_user');
    if (savedLineUser) {
      try {
        const userInfo = JSON.parse(savedLineUser);
        setLineUserInfo(userInfo);
        sessionStorage.removeItem('line_login_user');
      } catch (e) {
        console.error('Error parsing line user info:', e);
      }
    }
  }, []);

  const handleLineLoginSuccess = (userInfo) => {
    setLineUserInfo(userInfo);
    setIsLineCallback(false);
    // ลบ callback URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // ถ้าอยู่ในหน้า callback ให้แสดง LineCallback component
  if (isLineCallback) {
    return <LineCallback onLoginSuccess={handleLineLoginSuccess} />;
  }

  // ส่งข้อมูลผู้ใช้จาก Line ไปให้ ChequePrinter
  return <ChequePrinter lineUserInfo={lineUserInfo} />;
}

export default App;
