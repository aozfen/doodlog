# TikTok video fikirleri (2026-10-27)

Amaç: uygulamayı bitirmeden talebi test etmek. Kurucu kamera önüne çıkmıyor, çekim yapmıyor. Videolar tamamen üretilecek.

## Yapı (7–15 sn)
- 0–1 sn kanca: merak yaratan ekran yazısı. Logo, giriş yok.
- 1–8 sn dönüşüm: gerçek fotoğraf pastel boyayla çizime dönüşür.
- 8–15 sn kapanış: takvim çizimlerle dolar. "1 yılımız böyle görünüyor".
- Ses: TikTok içinden trend duygusal/sevimli müzik.
- Uygulama adı sadece sonda veya yorumda. Reklam gibi durmasın.

## Fikirler
1. **Çiftler, 30 gün:** "her gün bir fotoğrafımızı çizdirdim, 30 gün sonra..." 3 hızlı dönüşüm + dolu takvim. En güçlü fikir.
2. **Tepki:** "ona 1 yılımızı çizim olarak gösterdim". Partnerin yüzü kamerada. Gerçek kişi ister; üretilmiş kişiyle gerçekmiş gibi sunulmamalı.
3. **Evcil hayvan:** "köpeğimin her gününü çizdirdim". İkinci kitleyi test eder.
4. **Bebek:** "bebeğimin ilk yılı, her gün bir çizim". Ödemeye en hazır kitle.
5. **Kaydırarak karşılaştırma:** solda fotoğraf, sağda çizim, kaydırınca çizim açılır. Yazı yok, sadece müzik.

## Yüzsüz formatlar (çekim gerektirmez)
- **Ekran videosu:** prototipten dönüşüm animasyonu + takvim dolma sahnesi (1080x1920 MP4). Elimizdeki çizimler: design/assets cift_01–08, me_01, me_05, cut_kopek.
- **Metin + çizim akışı:** "POV: sevgilin her gününüzü çizdiriyor" yazısı, ardından çizimler sırayla çıkar.
- **Eller:** AI video aracıyla (Veo, Kling, Runway) telefon tutan eller, ekranda uygulama. Yüz yok.
- **Slayt (TikTok carousel):** 6–8 görsel, fotoğraf → çizim çiftleri, son görsel dolu takvim.

## Kurallar
- AI ile üretilmiş görüntüde TikTok "AI-generated" etiketini aç.
- Üretilmiş insanı gerçek kullanıcı/tepki gibi sunma (yanıltıcı reklam riski, hesap kapatılabilir).
- Öncelik: 1 ve 5, sonra 3 ve 4.

## Ölçüm
- Video başı izlenme, tamamlanma oranı, yorumda "app adı ne?" sayısı.
- Bekleme listesi (landing page) kayıt sayısı.

## Durum (2026-10-27)
- **Video 1 hazır:** `pazarlama/video1/doodlog_tiktok_01.mp4` (12 sn, 1080x1920, sessiz). Fikir 5'in tek yön versiyonu: 3 fotoğraf boyayla çizime dönüşür, ardından "our month" takvimi dolar, sonda Doodlog yazısı.
- Üretim: `scene.html` (render(t) fonksiyonu) + `node render.mjs` (Chrome CDP ile kare kare, ffmpeg ile MP4). Node 22 gerekli. Yaklaşık 2 dk sürer.
- **Bekliyor:** Pazarlamaya uygulama yayınlandıktan sonra bakılacak.
- **Yayın öncesi yapılacaklar:** `test/photos` fotoğraflarının kullanım hakkını kontrol et (stok olabilir). TikTok'ta müzik ekle.
- **Sıradaki video:** fikir 1 (çiftler, 30 gün).
