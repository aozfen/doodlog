# doods mimari

Fotoğraf → Gemini → çizim → defter ve takvim. Anılar telefonda kalır. Sunucu iki iş yapar: Gemini anahtarını saklar, fırçayı sayar.

Eski ortak defterli, uçtan uca şifreli tasarım: `MIMARI-v2-ortak-defter.md` (arşiv).

## Yığın
| Ne | Seçim |
|---|---|
| Uygulama | Expo, EAS yok (`expo prebuild` + yerel build) |
| Defter, anı, not | Evolu. MVP'de senkron kapalı |
| Çizimler | Yerel dosya (`documentDirectory`), Evolu'ya girmez |
| API | Cloudflare Workers + Hono |
| Fırça | D1 |
| Çizim modeli | Gemini (ücretli API) |
| Satın alma | RevenueCat → webhook → Worker |
| Hatırlatma | Yerel bildirim (`expo-notifications`) |
| Analitik | Amplitude (sadece olay, içerik yok) |
| Senkron (sonra) | Kendi Evolu relay'imiz, ayrı instance, R2 yedekli |

## Akışlar

**Anı ekle**
1. Fotoğraf 2048px JPEG'e küçültülür. Orijinal kopyalanmaz, galerideki asset ID tutulur.
2. `POST /ciz` → Worker fırça düşer, Gemini'yi çağırır, PNG döner. Fotoğraf ve çizim saklanmaz. Sadece çağrının token sayısı ve tutarı `gemini_cagri` tablosuna yazılır.
3. Çizim ve 256px küçüğü dosyaya yazılır, anı satırı Evolu'ya girer.

**Yeniden çiz**
- Orijinal asset ID ile galeriden bulunur. Bulunamazsa kullanıcı fotoğrafı yeniden seçer.
- Her çizimde ilk tekrar ücretsiz (`cizim.ucretsiz_tekrar`).

**İnternet yok**
- İstek kuyruğa girer, fırça düşülmez. Bağlantı gelince kendiliğinden gönderilir, bitince bildirim gider.
- Her istekte `istek_id` olur. Aynı istek iki kez gelirse fırça bir kez düşer.

**Gemini hatası**
- Fırça iade edilir, telafi olarak 1 fırça hediye edilir.

**Karakter tutarlılığı**
- Referans görseller (karakter kartları) telefonda tutulur, her `/ciz` isteğine sessizce eklenir.
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
```sql
CREATE TABLE kullanici (
  id TEXT PRIMARY KEY,                     -- ulid, iOS Keychain'de saklı
  apple_sub TEXT UNIQUE,
  google_sub TEXT UNIQUE,
  abone_firca INTEGER NOT NULL DEFAULT 0,
  paket_firca INTEGER NOT NULL DEFAULT 3,
  abone_bitis INTEGER,
  olusturma INTEGER NOT NULL
);
CREATE TABLE cizim (
  id TEXT PRIMARY KEY,                     -- istek_id
  kullanici_id TEXT NOT NULL REFERENCES kullanici(id),
  ucretsiz_tekrar INTEGER NOT NULL DEFAULT 1,
  olusturma INTEGER NOT NULL
);
CREATE TABLE firca_hareket (
  id TEXT PRIMARY KEY,
  kullanici_id TEXT NOT NULL REFERENCES kullanici(id),
  kova TEXT NOT NULL,                      -- abone|paket
  delta INTEGER NOT NULL,
  neden TEXT NOT NULL,                     -- hediye|cizim|iade|telafi|paket|abonelik
  ref TEXT,                                -- cizim id veya RevenueCat işlem id
  zaman INTEGER NOT NULL
);
CREATE TABLE gemini_cagri (                -- her Gemini çağrısı, tekrar ve hata dahil
  id TEXT PRIMARY KEY,
  cizim_id TEXT NOT NULL REFERENCES cizim(id),
  kullanici_id TEXT NOT NULL REFERENCES kullanici(id),
  model TEXT NOT NULL,
  girdi_token INTEGER NOT NULL,            -- usageMetadata.promptTokenCount
  gorsel_token INTEGER NOT NULL,           -- candidatesTokensDetails, modality IMAGE
  metin_token INTEGER NOT NULL,            -- kalan çıktı + thoughtsTokenCount
  maliyet_mikro INTEGER NOT NULL,          -- USD × 1.000.000
  sure_ms INTEGER NOT NULL,
  basarili INTEGER NOT NULL,               -- 0: görsel gelmedi ama ücret yine yazılır
  zaman INTEGER NOT NULL
);
CREATE INDEX gemini_cagri_zaman ON gemini_cagri(zaman);
```
Fırça düşme tek D1 `batch` içinde yapılır: önce `abone_firca > 0` koşuluyla düşülür, olmazsa `paket_firca > 0` koşuluyla, ardından `firca_hareket` satırı yazılır.

## Maliyet takibi
- Fiyatlar Worker ortam değişkeninde (USD / 1M token): `FIYAT_GIRDI=1.50`, `FIYAT_GORSEL=30.00`, `FIYAT_METIN=7.50`. Google fiyat değiştirirse sadece bunlar güncellenir. Tutar çağrı anındaki fiyatla yazılır, eski satırlar değişmez.
- Günlük toplam:
```sql
SELECT date(zaman/1000,'unixepoch') gun, count(*) cagri,
       round(sum(maliyet_mikro)/1e6, 2) usd,
       round(avg(maliyet_mikro)/1e6, 4) ortalama
FROM gemini_cagri GROUP BY gun ORDER BY gun DESC;
```
- Çalıştırma: `wrangler d1 execute doodlog --remote --command "..."`.

## API
| Uç | İş |
|---|---|
| `POST /auth/anon` | kullanıcı + JWT (HS256, 30 gün), cihaz kontrolüyle 3 hediye fırça |
| `POST /auth/apple` · `/auth/google` | hesap bağla, fırça ve abonelik yeni cihaza taşınır |
| `GET /firca` | iki bakiye + yenilenme tarihi |
| `POST /ciz` | fırça düş, Gemini, PNG dön |
| `DELETE /hesap` | kullanıcıyı ve fırça geçmişini sil |
| `POST /webhook/revenuecat` | abonelik ve paket → `firca_hareket` |

## Telefonda (Evolu)
- `defter`: `tur`, `ad`, `kapakAniId`
- `ani`: `defterId`, `cizimId`, `gun`, `metin`, `assetId`, `dosya`, `kucuk`
- Evolu owner anahtarı kullanıcıya gösterilmez. iOS'ta iCloud Keychain'e, Android'de Block Store'a sessizce yazılır.
- Evolu sürümü sabitlenir. Veriye tek katmandan erişilir (`depo.ts`).
- Widget, paylaşım kartı, yıl sonu görseli ve fırça bitti kolajı telefonda üretilir. Widget çizimleri App Group'tan okur.
- **Verilerimi sil:** Evolu verisi sıfırlanır, çizim dosyaları silinir, `DELETE /hesap` çağrılır.

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
