# คู่มือการตั้งค่า Line Login

## ขั้นตอนการตั้งค่า

### 1. สร้าง Line Login Channel

1. ไปที่ [Line Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider ใหม่ (ถ้ายังไม่มี)
3. สร้าง Channel ใหม่ และเลือก **LINE Login**
4. ตั้งค่าดังนี้:
   - **Channel name**: ชื่อ Channel ของคุณ
   - **Channel description**: คำอธิบาย Channel

### 2. ตั้งค่า Callback URL

1. ไปที่แท็บ **LINE Login settings**
2. ในส่วน **Callback URL** เพิ่ม:
   - Development: `http://localhost:5173/auth/line/callback`
   - Production: `https://yourdomain.com/auth/line/callback`
3. บันทึกการตั้งค่า

### 3. รับ Channel ID และ Channel Secret

1. ไปที่แท็บ **Basic settings**
2. คัดลอก **Channel ID** และ **Channel Secret**
3. เปิดไฟล์ `.env` (สร้างใหม่จาก `.env.example`) และใส่ค่าตามนี้:

```env
VITE_LINE_CHANNEL_ID=your_channel_id_here
VITE_LINE_CHANNEL_SECRET=your_channel_secret_here
```

### 4. ตั้งค่า Scopes

ใน Line Developers Console:
- ไปที่ **LINE Login settings** > **Bot & LINE Login**
- เปิดใช้งาน **Email address permission** (ถ้าต้องการรับ email จากผู้ใช้)
- เปิดใช้งาน **OpenID Connect** เพื่อให้ได้รับ ID Token

### 5. รีสตาร์ท Development Server

หลังจากตั้งค่า `.env` แล้ว:
```bash
npm run dev
```

## การทดสอบ

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`
2. คลิกปุ่ม **Line** ในหน้า Login
3. ระบบจะ redirect ไปที่ Line Login
4. อนุญาตการเข้าสู่ระบบ
5. ระบบจะ redirect กลับมาและเข้าสู่ระบบอัตโนมัติ

## หมายเหตุสำคัญ

- **Channel Secret** เป็นข้อมูลลับ อย่า commit ลงใน Git
- ตรวจสอบว่าได้ตั้งค่า Callback URL ให้ถูกต้อง
- ใน Production ต้องใช้ HTTPS
- ตรวจสอบว่า Channel อยู่ในสถานะ **Published** หรือ **Development**

## Troubleshooting

### "Line Login ไม่พร้อมใช้งาน กรุณาตรวจสอบการตั้งค่า"
- ตรวจสอบว่าได้ตั้งค่า `VITE_LINE_CHANNEL_ID` ในไฟล์ `.env` แล้ว
- ตรวจสอบว่า Channel ID ถูกต้อง

### "Invalid state parameter"
- หมายความว่า session หมดอายุ หรือมีการเปิดหน้าใหม่
- ลองล็อกอินใหม่อีกครั้ง

### "Failed to exchange code for token"
- ตรวจสอบว่า Channel Secret ถูกต้อง
- ตรวจสอบว่า Callback URL ตรงกับที่ตั้งค่าใน Line Developers Console

### "Failed to get Line profile"
- ตรวจสอบว่า Access Token ยังไม่หมดอายุ
- ตรวจสอบว่า Channel อยู่ในสถานะที่ใช้งานได้

