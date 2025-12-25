# คู่มือการตั้งค่า Facebook Login

## ขั้นตอนการตั้งค่า

### 1. สร้าง Facebook App

1. ไปที่ [Facebook Developers](https://developers.facebook.com/apps/)
2. คลิก "สร้างแอป" (Create App)
3. เลือกประเภท "ผู้บริโภค" (Consumer) หรือ "ธุรกิจ" (Business)
4. กรอกชื่อแอปและอีเมลติดต่อ

### 2. เพิ่ม Facebook Login Product

1. ในหน้า Dashboard ของ App ของคุณ
2. คลิก "เพิ่มผลิตภัณฑ์" (Add Product)
3. เลือก "Facebook Login"
4. คลิก "ตั้งค่า" (Set Up)

### 3. ตั้งค่า OAuth Redirect URIs

1. ไปที่ Settings > Basic
2. คัดลอก **App ID** ของคุณ
3. ไปที่ Settings > Facebook Login > Settings
4. เพิ่ม **Valid OAuth Redirect URIs**:
   - สำหรับ development: `http://localhost:5173` (หรือพอร์ตที่คุณใช้)
   - สำหรับ production: `https://yourdomain.com`

### 4. ตั้งค่า App Domains

1. ไปที่ Settings > Basic
2. ในส่วน **App Domains** เพิ่ม:
   - `localhost` (สำหรับ development)
   - `yourdomain.com` (สำหรับ production)

### 5. ตั้งค่า Environment Variable

1. สร้างไฟล์ `.env` ในโฟลเดอร์ root ของโปรเจกต์
2. เพิ่มบรรทัดต่อไปนี้:

```env
VITE_FACEBOOK_APP_ID=your_app_id_here
```

**ตัวอย่าง:**
```env
VITE_FACEBOOK_APP_ID=1234567890123456
```

### 6. เริ่มต้นใช้งาน

1. รีสตาร์ท development server:
   ```bash
   npm run dev
   ```

2. เปิดเบราว์เซอร์และทดสอบการล็อกอินด้วย Facebook

## หมายเหตุสำคัญ

- ⚠️ **App ID** ต้องเป็นของจริงจาก Facebook Developers
- ⚠️ ต้องตั้งค่า **OAuth Redirect URIs** ให้ถูกต้อง
- ⚠️ สำหรับ production ต้องใช้ HTTPS
- ⚠️ ตรวจสอบว่า App ของคุณอยู่ในโหมด **Development** หรือ **Live** ตามความเหมาะสม

## การแก้ไขปัญหา

### ปัญหา: "App Not Setup"
- ตรวจสอบว่าได้เพิ่ม Facebook Login product แล้ว
- ตรวจสอบว่า App ID ถูกต้อง

### ปัญหา: "Invalid OAuth Redirect URI"
- ตรวจสอบว่าได้เพิ่ม URI ที่ถูกต้องใน Facebook App Settings
- ตรวจสอบว่า URI ตรงกับ URL ที่คุณใช้งานจริง

### ปัญหา: "SDK ยังไม่โหลดเสร็จ"
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ตรวจสอบ Console ในเบราว์เซอร์ว่ามี error อะไร

## ข้อมูลเพิ่มเติม

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Facebook SDK for JavaScript](https://developers.facebook.com/docs/javascript/)

