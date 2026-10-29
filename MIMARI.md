# doods mimari

Fotoğraf → Gemini → çizim → defter ve takvim. Anılar telefonda kalır. Sunucu iki iş yapar: Gemini anahtarını saklar, fırçayı sayar.

Eski ortak defterli, uçtan uca şifreli tasarım: `MIMARI-v2-ortak-defter.md` (arşiv).

## Yığın
| Ne | Seçim |
|---|---|
| Uygulama | Expo, EAS yok (`expo prebuild` + yerel build) |
| Defter, anı, not | Evolu. MVP'de senkron kapalı |
| Çizimler | Yerel dosya (`documentDirectory`), Evolu'ya girmez |
| API | Cloudflare Workers (`worker/`, düz `fetch` router, snipmind düzeni) |
| Fırça | D1 |
| Çizim modeli | Gemini (ücretli API) |
| Satın alma | RevenueCat → webhook → Worker |
| Hatırlatma | Yerel bildirim (`expo-notifications`) |
| Analitik | Amplitude (sadece olay, içerik yok) |
| Senkron (sonra) | Kendi Evolu relay'imiz, ayrı instance, R2 yedekli |

## Akışlar

**Anı ekle**
1. Fotoğraf 2048px JPEG'e küçültülür. Orijinal kopyalanmaz, galerideki asset ID tutulur.
2. `POST /v1/draw` → Worker fırça düşer, Gemini'yi çağırır, PNG döner. Fotoğraf ve çizim saklanmaz. Sadece çağrının token sayısı ve tutarı `gemini_calls` tablosuna yazılır.
3. Çizim ve 256px küçüğü dosyaya yazılır, anı satırı Evolu'ya girer.

**Yeniden çiz**
- Orijinal asset ID ile galeriden bulunur. Bulunamazsa kullanıcı fotoğrafı yeniden seçer.
- Ücretsiz yeniden çizim yok, her çizim 1 fırça.

**İnternet yok**
- İstek kuyruğa girer, fırça düşülmez. Bağlantı gelince kendiliğinden gönderilir, bitince bildirim gider.
- Her istekte `requestId` olur. Aynı istek iki kez gelirse fırça bir kez düşer. Cevap kaybolduysa aynı istek bir kez daha ücretsiz çizilir, üçüncüsü `409`.

**Gemini hatası**
- Fırça iade edilir, telafi olarak 1 fırça hediye edilir. Telafi günde en fazla bir kez (aynı hatalı fotoğrafla fırça toplanamasın).

**Karakter tutarlılığı**
- Referans görseller (karakter kartları) telefonda tutulur, her `/v1/draw` isteğine sessizce eklenir.
- Sadece o defterin kartları gönderilir. Kart sayısı fotoğraf sayısıyla artmaz.
- Defter başına en fazla 4 kart. Worker da 4'ten fazla kartı reddeder, böylece girdi maliyeti çizim başı ~$0,007'yi geçmez.

## Fırça kuralları
- İki ayrı bakiye var:
  - **Abonelik:** dönem başında 50 olur, kalan fırça devretmez.
  - **Paket:** hediye ve satın alınan paketler, süresi dolmaz.
- Önce abonelik bakiyesi harcanır. İkisi de sıfırsa `402` döner ve fırça bitti ekranı açılır.
- RevenueCat `INITIAL_PURCHASE` / `RENEWAL` / `PRODUCT_CHANGE` olaylarında abonelik bakiyesi 50 yapılır. Abonelik grubunda yıllık plan aylığın üstünde tanımlanır, böylece aylıktan yıllığa geçiş hemen başlar.
- Hediye 3 fırça cihaz başına bir kez verilir: iOS'ta DeviceCheck, Android'de Play Integrity.

## D1
Şema: `worker/migrations/0001_init.sql`. Tablolar: `users`, `draws`, `brush_moves`, `gemini_calls`.
- `users.id` uygulamanın Ed25519 public key'i. Kayıt ya da token yok.
- Fırça düşme koşullu `UPDATE` ile yapılır: önce `sub_brushes > 0` ve abonelik süresi dolmamışsa, olmazsa `pack_brushes > 0`. Ardından `brush_moves` satırı yazılır.
- Hesap silinince `draws` ve `brush_moves` silinir, `gemini_calls` kullanıcısız kalır (maliyet istatistiği için).

## Maliyet takibi
- Fiyatlar Worker ortam değişkeninde (USD / 1M token): `PRICE_INPUT=1.50`, `PRICE_IMAGE=30.00`, `PRICE_TEXT=7.50`. Google fiyat değiştirirse sadece bunlar güncellenir. Tutar çağrı anındaki fiyatla yazılır, eski satırlar değişmez.
- Günlük toplam:
```sql
SELECT date(created_at/1000,'unixepoch') gun, count(*) cagri,
       round(sum(cost_micros)/1e6, 2) usd,
       round(avg(cost_micros)/1e6, 4) ortalama
FROM gemini_calls GROUP BY gun ORDER BY gun DESC;
```
- Çalıştırma: `wrangler d1 execute doodlog --remote --command "..."`.

## API
Her `/v1` isteği imzalı: `Authorization: Doodlog key=<public key>, ts=<unix sn>, sig=<imza>`. İmzalanan metin `doodlog-v1\n<METHOD>\n<path>\n<ts>\n<body sha256 hex>`. Ayrıntı: `worker/src/auth.ts`.

| Uç | İş |
|---|---|
| `GET /v1/brushes` | iki bakiye + yenilenme tarihi. İlk istekte kullanıcı açılır, 3 hediye fırça |
| `POST /v1/draw` | `{ requestId, photo, cards }` → fırça düş, Gemini, `{ image, brushes }` dön |
| `DELETE /v1/account` | kullanıcıyı ve fırça geçmişini sil |
| `POST /v1/auth/apple` · `/v1/auth/google` | (sonra) hesap bağla, fırça ve abonelik yeni cihaza taşınır |
| `POST /v1/webhooks/revenuecat` | (sonra) abonelik ve paket → `brush_moves` |

Hediye şimdilik anahtar başına veriliyor. Yayından önce DeviceCheck / Play Integrity ile cihaz başına bir kez yapılmalı.

## Telefonda (Evolu)
- `defter`: `tur`, `ad`, `kapakAniId`
- `ani`: `defterId`, `cizimId`, `gun`, `metin`, `assetId`, `dosya`, `kucuk`
- Evolu owner anahtarı kullanıcıya gösterilmez. iOS'ta iCloud Keychain'e, Android'de Block Store'a sessizce yazılır.
- Evolu sürümü sabitlenir. Veriye tek katmandan erişilir (`depo.ts`).
- Widget, paylaşım kartı, yıl sonu görseli ve fırça bitti kolajı telefonda üretilir. Widget çizimleri App Group'tan okur.
- **Verilerimi sil:** Evolu verisi sıfırlanır, çizim dosyaları silinir, `DELETE /v1/account` çağrılır.

## Yedek
- iOS: uygulama verisi iCloud cihaz yedeğine kendiliğinden girer.
- Android: otomatik yedek uygulama başına 25 MB, çizimler sığmaz.
- Yedek yoksa ve telefon kaybolursa anılar kurtarılamaz. Ayrı bir uyarı ekranı yok; bilgi gizlilik metninde.
- Gizlilik metni: "Fotoğrafın çizim için Google'a gider, saklanmaz. Anıların sadece senin telefonunda."
- Senkron açıldığında `dosya` ve `kucuk` yolları diğer cihazda geçersiz olur. Bu durumda çizimler için şifreli R2 gerekir (arşivdeki tasarım).

## Ortak defter: sahte kapı testi
- Sevgili defterinde "Partnerini davet et" butonu var. Basınca "yakında" ekranı ve "haber ver" seçeneği çıkar (`design/a-davet-yakinda.html`).
- Olaylar: `davet_kapi_goruldu`, `davet_kapi_tiklandi`, `davet_haber_ver`.
- Sevgili defteri açanların ~%20'sinden fazlası tıklarsa ortak defter v2'de yapılır.

## Açık kararlar
- İlk sürüm sadece iOS mu? Android de olacaksa yedek nasıl yapılacak (dışa aktarma ya da Drive)?
- Evolu senkronu ne zaman açılacak (ortak defter ya da çoklu cihaz talebi gelince)?
- Sahte kapı eşiği: %20 öneri.
