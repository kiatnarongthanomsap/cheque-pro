# การตั้งค่า Google Sign-In

## ขั้นตอนการตั้งค่า

### 1. สร้างโปรเจกต์ใน Google Cloud Console

1. เข้าสู่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่หรือเลือกโปรเจกต์ที่มีอยู่
3. เปิดใช้งาน **Google+ API** หรือ **Google Identity Services**

### 2. สร้าง OAuth 2.0 Client ID

1. ไปที่ **APIs & Services** → **Credentials**
2. คลิก **Create Credentials** → **OAuth client ID**
3. หากยังไม่ได้ตั้งค่า OAuth consent screen:
   - ไปที่ **OAuth consent screen**
   - เลือก **External** (สำหรับการทดสอบ) หรือ **Internal** (สำหรับ Google Workspace)
   - กรอกข้อมูลที่จำเป็น (App name, User support email, Developer contact)
   - เพิ่ม Scopes: `openid`, `profile`, `email`
   - เพิ่ม Test users (ถ้าใช้ External)
4. กลับไปที่ **Credentials** → **Create Credentials** → **OAuth client ID**
5. เลือก **Application type**: **Web application**
6. ตั้งชื่อ Client ID (เช่น: "Cheque Pro Web Client")
7. เพิ่ม **Authorized JavaScript origins**:
   - สำหรับ development: `http://localhost:5173` (หรือ port ที่คุณใช้)
   - สำหรับ production: `https://yourdomain.com`
8. เพิ่ม **Authorized redirect URIs**:
   - สำหรับ development: `http://localhost:5173` (หรือ port ที่คุณใช้)
   - สำหรับ production: `https://yourdomain.com`
9. คลิก **Create**
10. คัดลอก **Client ID** ที่ได้

### 3. อัปเดตโค้ด

เปิดไฟล์ `src/ChequePrinter.jsx` และแก้ไขใน 2 จุด:

#### จุดที่ 1: Google Sign-In Initialization (ประมาณบรรทัด 203-208)
```javascript
window.google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID', // เปลี่ยนเป็น Client ID ของคุณ
    callback: handleGoogleSignIn,
    auto_select: false,
    cancel_on_tap_outside: true
});
```

#### จุดที่ 2: handleSocialLogin function (ประมาณบรรทัด 347)
```javascript
window.google.accounts.oauth2.initTokenClient({
    client_id: 'YOUR_GOOGLE_CLIENT_ID', // เปลี่ยนเป็น Client ID ของคุณ
    scope: 'openid profile email',
    callback: (tokenResponse) => {
        // ... existing code
    }
}).requestAccessToken();
```

### 4. ตัวอย่างการตั้งค่า

```javascript
// ในทั้ง 2 จุด เปลี่ยนเป็น:
client_id: '123456789-abcdefghijklmnop.apps.googleusercontent.com'
```

## หมายเหตุ

- สำหรับการใช้งานใน production ควร verify JWT token กับ Google server
- ต้องใช้ HTTPS ใน production (Google ไม่อนุญาต HTTP ยกเว้น localhost)
- สำหรับ development สามารถใช้ `localhost` ได้
- Client ID ต้องตรงกันทั้ง 2 จุดในโค้ด

## การทดสอบ

1. เปิดแอปพลิเคชัน
2. คลิกปุ่ม "Google" ในหน้าล็อกอิน
3. ระบบจะเปิด popup สำหรับ Sign In with Google
4. เลือกบัญชี Google ที่ต้องการใช้
5. อนุญาตการเข้าถึงข้อมูล (ถ้าจำเป็น)
6. หลังจากล็อกอินสำเร็จ ข้อมูลผู้ใช้จะถูกบันทึกใน Local Storage

## Troubleshooting

### ปัญหา: "Google Sign-In ยังไม่พร้อมใช้งาน"
- ตรวจสอบว่า Google Identity Services script โหลดแล้วหรือไม่
- ตรวจสอบ console สำหรับ error messages
- ตรวจสอบว่า Client ID ถูกต้อง

### ปัญหา: "Error 400: redirect_uri_mismatch"
- ตรวจสอบว่า Authorized redirect URIs ใน Google Cloud Console ตรงกับ URL ของแอป
- ตรวจสอบว่าใช้ http/https ถูกต้อง

### ปัญหา: "Error 403: access_denied"
- ตรวจสอบว่า OAuth consent screen ตั้งค่าเรียบร้อยแล้ว
- ถ้าใช้ External app type ต้องเพิ่ม test users

