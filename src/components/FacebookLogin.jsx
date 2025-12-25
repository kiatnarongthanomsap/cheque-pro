import { useEffect, useState } from 'react';
import { Facebook, Loader2 } from 'lucide-react';

const FacebookLogin = ({ onLoginSuccess, onLoginError, compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // โหลด Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_APP_ID',
        cookie: true,
        xfbml: true,
        version: 'v21.0'
      });
    };

    // โหลด Facebook SDK script
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/th_TH/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    
    if (!window.FB) {
      console.error('Facebook SDK ยังไม่โหลดเสร็จ');
      setIsLoading(false);
      return;
    }

    window.FB.login((response) => {
      setIsLoading(false);
      
      if (response.authResponse) {
        // ดึงข้อมูลผู้ใช้
        window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
          if (userInfo && !userInfo.error) {
            const userData = {
              id: userInfo.id,
              name: userInfo.name,
              email: userInfo.email,
              picture: userInfo.picture?.data?.url,
              accessToken: response.authResponse.accessToken
            };
            setUser(userData);
            if (onLoginSuccess) {
              onLoginSuccess(userData);
            }
          } else {
            console.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้:', userInfo.error);
            if (onLoginError) {
              onLoginError(userInfo.error);
            }
          }
        });
      } else {
        console.error('การล็อกอินล้มเหลว');
        if (onLoginError) {
          onLoginError('ผู้ใช้ยกเลิกการล็อกอิน');
        }
      }
    }, { scope: 'email,public_profile' });
  };

  const handleLogout = () => {
    if (window.FB) {
      window.FB.logout((response) => {
        setUser(null);
      });
    }
  };

  const checkLoginStatus = () => {
    if (window.FB) {
      window.FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
            if (userInfo && !userInfo.error) {
              const userData = {
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture?.data?.url,
                accessToken: response.authResponse.accessToken
              };
              setUser(userData);
              if (onLoginSuccess) {
                onLoginSuccess(userData);
              }
            }
          });
        }
      });
    }
  };

  useEffect(() => {
    // ตรวจสอบสถานะการล็อกอินเมื่อ SDK โหลดเสร็จ
    const checkInterval = setInterval(() => {
      if (window.FB) {
        clearInterval(checkInterval);
        checkLoginStatus();
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  if (user && !compact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
        <img 
          src={user.picture || 'https://via.placeholder.com/50'} 
          alt={user.name}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={compact 
        ? "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition group w-full"
        : "flex items-center justify-center gap-3 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      }
    >
      {isLoading ? (
        <>
          {compact ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          ) : (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>กำลังล็อกอิน...</span>
            </>
          )}
        </>
      ) : (
        <>
          {compact ? (
            <>
              <Facebook className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-600">Facebook</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>ล็อกอินด้วย Facebook</span>
            </>
          )}
        </>
      )}
    </button>
  );
};

export default FacebookLogin;

