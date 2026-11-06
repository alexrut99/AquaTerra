<p align="center"><img src="docs/logo.svg" width="120" alt="AquaTerra logo: a water drop with a pumping well and its cone of drawdown"></p>
<h1 align="center">AquaTerra</h1>
<p align="center"><b>โปรแกรมวิเคราะห์ Pumping Test ฟรีและโอเพนซอร์ส</b><br>Free and open-source pumping test analysis, for the web and the desktop.</p>
<p align="center">
  <a href="https://alexrut99.github.io/AquaTerra/"><b>🌐 เปิดใช้บนเว็บ</b></a> ·
  <a href="https://github.com/alexrut99/AquaTerra/releases/latest"><b>💻 ดาวน์โหลดโปรแกรม</b></a> ·
  <a href="https://github.com/alexrut99/AquaTerra/issues">แจ้งปัญหา</a>
</p>

**ผู้พัฒนา: อนิรุทธ์ ลดาวดี (Anirut Ladawadee)**

## ความสามารถ

| วิธี | ใช้กับ | ผลลัพธ์ |
|---|---|---|
| Theis Type Curve | ชั้นน้ำมีแรงดัน | T, S, K |
| Cooper-Jacob | ช่วงเวลา u น้อย | T, S |
| Theis Recovery | ข้อมูลน้ำคืนตัว | T |
| Step Drawdown | ประสิทธิภาพบ่อ | B, C, Well Efficiency |
| Multi-Well | บ่อสังเกตการณ์หลายบ่อ | T, S |
| Hantush-Jacob | ชั้นน้ำรั่วซึม | T, S, B |
| Distance-Drawdown | หลายระยะ ณ เวลาเดียวกัน | T, S, r₀ |
| Superposition | หลายบ่อ อัตราสูบเปลี่ยน | s(x, y, t) |
| Single Well | บ่อเดียว | T, Specific Capacity |
| Slug Test | Hvorslev, Bouwer-Rice | K |
| Neuman (1975) | ชั้นน้ำไม่มีแรงดัน | T, S, Sy, β, Kz |

นอกจากนี้มี Well Map (UTM), รายงาน, เปรียบเทียบผลหลายวิธี และนำเข้า Excel/CSV ใช้งานแบบ offline ได้ ยกเว้นแผนที่ฐาน

ใช้ได้ทั้งภาษาไทยและอังกฤษ สลับได้จากปุ่ม ไทย/EN มุมขวาบน / Available in Thai and English: use the switch at the top right. ข้อความอยู่ที่ `web/i18n-dict.js`

## ความถูกต้อง

ทุกการเปลี่ยนแปลงต้องผ่าน [ชุดทดสอบ](tests/acceptance.js) ซึ่งเทียบผลกับคำตอบที่คำนวณแยกจากโปรแกรมด้วย SciPy และ mpmath ([tests/ref](tests/ref))

**ยังไม่ได้เทียบกับข้อมูลสนามจริงอย่างเป็นระบบ หรือกับโปรแกรมเชิงพาณิชย์** ผลคำนวณต้องให้ผู้เชี่ยวชาญตรวจสอบก่อนนำไปใช้งานจริง ถ้าพบค่าที่ไม่ตรง [แจ้งได้เลย](https://github.com/alexrut99/AquaTerra/issues)

## ติดตั้ง

ดาวน์โหลดจากหน้า [Releases](https://github.com/alexrut99/AquaTerra/releases/latest)

| ไฟล์ | ใช้กับ |
|---|---|
| `AquaTerra-x.y.z-setup.exe` | Windows แบบติดตั้ง |
| `AquaTerra-x.y.z-portable.exe` | Windows ดับเบิลคลิกใช้ได้เลย |
| `AquaTerra-x.y.z-mac-universal.dmg` | macOS |
| `AquaTerra-x.y.z-linux-x86_64.AppImage` | Linux |

> ไฟล์ยังไม่ได้ลงลายเซ็นดิจิทัล Windows จะเตือนครั้งแรก ให้กด **More info › Run anyway** ส่วน macOS ให้คลิกขวาที่แอป › **Open**

## พัฒนาต่อ

```bash
git clone https://github.com/alexrut99/AquaTerra.git
cd AquaTerra
npm ci
npm start        # เปิดโปรแกรม desktop
npm run serve    # เปิดเว็บที่ http://localhost:8080
npm test         # ชุดทดสอบ (ครั้งแรกรัน npx playwright install chromium)
```

ตัวโปรแกรมอยู่ที่ `web/index.html` ดูแนวทางที่ [CONTRIBUTING.md](CONTRIBUTING.md)

**ออกเวอร์ชันใหม่:** `git tag v4.1.1 && git push origin v4.1.1` แล้ว GitHub จะทดสอบ สร้างไฟล์ติดตั้ง และแนบใน Releases ให้เอง ส่วนเว็บจะอัปเดตเองเมื่อ push ไป `main`

## สัญญาอนุญาต

[Apache License 2.0](LICENSE) © 2025–2026 Anirut Ladawadee ใช้ แก้ไข และเผยแพร่ต่อได้ รวมถึงเชิงพาณิชย์ โดยต้องคงข้อความลิขสิทธิ์และแจ้งการแก้ไข ให้มาตามสภาพ ไม่มีการรับประกัน ส่วนไลบรารีและฟอนต์ที่รวมมาอยู่ใน [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)

ถ้าใช้ในงานวิจัย ขอให้อ้างอิงตาม [CITATION.cff](CITATION.cff)
