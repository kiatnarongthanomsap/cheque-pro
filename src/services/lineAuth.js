/**
 * Line Login OAuth 2.0 Integration
 * 
 * วิธีการใช้งาน:
 * 1. ไปที่ https://developers.line.biz/console/ และสร้าง Channel
 * 2. ตั้งค่า Redirect URI: http://localhost:5173/auth/line/callback (development)
 * 3. คัดลอก Channel ID และ Channel Secret มาใส่ในไฟล์ .env
 */

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

/**
 * สร้าง URL สำหรับเริ่มต้น Line Login
 */
export const getLineAuthUrl = () => {
  const channelId = import.meta.env.VITE_LINE_CHANNEL_ID;
  
  if (!channelId) {
    console.error('VITE_LINE_CHANNEL_ID is not set in .env file');
    return null;
  }

  const redirectUri = `${window.location.origin}/auth/line/callback`;
  const state = generateRandomString(32); // CSRF protection
  const nonce = generateRandomString(32);

  // เก็บ state ใน sessionStorage สำหรับตรวจสอบใน callback
  sessionStorage.setItem('line_auth_state', state);
  sessionStorage.setItem('line_auth_nonce', nonce);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: redirectUri,
    state: state,
    scope: 'profile openid email',
    nonce: nonce,
  });

  return `${LINE_AUTH_URL}?${params.toString()}`;
};

/**
 * แลกเปลี่ยน authorization code เป็น access token
 */
export const exchangeCodeForToken = async (code, state) => {
  // ตรวจสอบ state เพื่อป้องกัน CSRF
  const savedState = sessionStorage.getItem('line_auth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }

  const channelId = import.meta.env.VITE_LINE_CHANNEL_ID;
  const channelSecret = import.meta.env.VITE_LINE_CHANNEL_SECRET;
  const redirectUri = `${window.location.origin}/auth/line/callback`;

  if (!channelId || !channelSecret) {
    throw new Error('Line credentials not configured');
  }

  try {
    const response = await fetch(LINE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange code for token');
    }

    const data = await response.json();
    
    // เก็บ access token และ id token
    sessionStorage.setItem('line_access_token', data.access_token);
    if (data.id_token) {
      sessionStorage.setItem('line_id_token', data.id_token);
    }

    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Line
 */
export const getLineProfile = async (accessToken) => {
  try {
    const response = await fetch(LINE_PROFILE_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Line profile');
    }

    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error('Error getting Line profile:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลจาก ID Token (ถ้ามี email)
 */
export const decodeIdToken = (idToken) => {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format');
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding ID token:', error);
    return null;
  }
};

/**
 * สร้าง random string สำหรับ state และ nonce
 */
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * เริ่มต้น Line Login process
 */
export const initiateLineLogin = () => {
  const authUrl = getLineAuthUrl();
  if (authUrl) {
    window.location.href = authUrl;
  } else {
    alert('Line Login ไม่พร้อมใช้งาน กรุณาตรวจสอบการตั้งค่า');
  }
};

/**
 * จัดการ callback หลังจากผู้ใช้ authorize แล้ว
 */
export const handleLineCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    throw new Error(`Line Login error: ${error}`);
  }

  if (!code) {
    throw new Error('No authorization code received');
  }

  try {
    // แลกเปลี่ยน code เป็น token
    const tokenData = await exchangeCodeForToken(code, state);
    
    // ดึงข้อมูลโปรไฟล์
    const profile = await getLineProfile(tokenData.access_token);
    
    // ถ้ามี id_token ให้ decode เพื่อหา email
    let email = null;
    if (tokenData.id_token) {
      const idTokenPayload = decodeIdToken(tokenData.id_token);
      email = idTokenPayload?.email || null;
    }

    // ทำความสะอาด sessionStorage
    sessionStorage.removeItem('line_auth_state');
    sessionStorage.removeItem('line_auth_nonce');

    return {
      id: `line_${profile.userId}`,
      provider: 'line',
      displayName: profile.displayName || 'Line User',
      picture: profile.pictureUrl || null,
      email: email,
      userId: profile.userId,
      accessToken: tokenData.access_token,
    };
  } catch (error) {
    console.error('Line Login callback error:', error);
    throw error;
  }
};

