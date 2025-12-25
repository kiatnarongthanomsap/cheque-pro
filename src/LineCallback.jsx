import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { handleLineCallback } from './services/lineAuth';

/**
 * Component สำหรับจัดการ callback หลังจาก Line Login
 */
function LineCallback({ onLoginSuccess }) {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // เรียกใช้ handleLineCallback เพื่อประมวลผล
        const userInfo = await handleLineCallback();

        // เก็บข้อมูลผู้ใช้ไว้ใน sessionStorage เพื่อให้ App สามารถใช้ได้
        sessionStorage.setItem('line_login_user', JSON.stringify(userInfo));
        
        setStatus('success');
        setMessage('เข้าสู่ระบบสำเร็จ! กำลังนำคุณไป...');

        // เรียก callback function เพื่อแจ้ง App ว่าล็อกอินสำเร็จ
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess(userInfo);
            // ลบ callback URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 1000);
        } else {
          // ถ้าไม่มี callback ให้ redirect กลับไปที่หน้าแรก
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } catch (error) {
        console.error('Line callback error:', error);
        setStatus('error');
        setMessage(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        
        // ลบ callback URL parameters และ redirect หลังจาก 3 วินาที
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          if (onLoginSuccess) {
            // ถ้ามี callback ก็ไม่ต้อง redirect
          } else {
            window.location.href = '/';
          }
        }, 3000);
      }
    };

    processCallback();
  }, [onLoginSuccess]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">กำลังเข้าสู่ระบบ...</h2>
            <p className="text-gray-600">กรุณารอสักครู่</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">สำเร็จ!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default LineCallback;

