# doods mimari (ARŞİV: ortak defterli, uçtan uca şifreli sürüm)

> 26 Ekim 2026: MVP için rafa kaldırıldı. Güncel mimari `MIMARI.md`. Ortak defter v2 gelirse bu tasarım başlangıç noktası.

## Hedef
- Fotoğraf → Gemini → çizim. Anı defter + takvime düşer.
- **Sunucuda (R2, D1) içerik okunamaz.** Fotoğraf, çizim, not, defter adı uçtan uca şifreli. Sahip dahil kimse açamaz.
- Yeniden çizim her zaman mümkün: orijinal de şifreli saklanır.
- Expo, EAS yok (`expo prebuild` + yerel build).

## Yığın
| Katman | Seçim |
|---|---|
| API | Cloudflare Workers + Hono |
| Veritabanı | D1 (sadece metadata) |
| Dosya | R2 (sadece şifreli bayt), private bucket, presigned URL |
| Çizim | Gemini (ücretli API, eğitimde kullanılmaz – şartları teyit et) |
| Satın alma | RevenueCat (abonelik + fırça paketi), webhook → Worker |
| Push | APNs / FCM doğrudan Worker'dan (Expo push token EAS ister) |
| Kripto (istemci) | `@noble/ciphers` (XChaCha20-Poly1305), `@noble/curves` (X25519), `@noble/hashes` (HKDF, scrypt) |

## Akış

### Anı ekle
1. Telefon fotoğrafı 2048px JPEG'e küçültür.
2. `POST /ciz` → Worker 1 fırça düşer, Gemini'yi çağırır, çizimi (PNG) döner. **Worker hiçbir şey saklamaz, loglamaz.**
3. Telefon orijinal + çizim + 256px küçük çizim + notu defter anahtarıyla şifreler.
4. `POST /ani` → D1 satırı + presigned PUT URL'leri. Telefon R2'ye doğrudan yükler.
5. `POST /ani/:id/tamam` → partnere push ("Elif bir anı ekledi", görselsiz).

### Yeniden çiz
1. Telefon `o` dosyasını indirir, çözer.
2. `POST /ciz` (`ani_id` ile). Anı başına ilk yeniden çizim ücretsiz.
3. Yeni çizim şifrelenir, `c` ve `t` üzerine yazılır, `surum` +1.

### Hata
- Gemini başarısız → fırça iade + 1 hediye (`firca_hareket` iki satır).

## Şifreleme

### Anahtarlar
- **Kullanıcı anahtar çifti** (X25519): ilk açılışta telefonda üretilir. Public key D1'e gider. Private key cihazdan çıkmaz.
- **Defter anahtarı** (32 bayt rastgele): defter açılırken üretilir. Her üye için o üyenin public key'iyle sarılır (`uye.sarili_anahtar`).
- Sarma: geçici X25519 + HKDF-SHA256 + XChaCha20-Poly1305 (sealed box benzeri).

### Dosya biçimi
`[1 bayt sürüm][24 bayt nonce][şifreli veri + 16 bayt tag]`
AAD = `ani_id|tür` (dosyalar birbirinin yerine konamaz).

### Cihaz değişimi / kurtarma
- Private key iCloud Keychain'de (`kSecAttrSynchronizable`), Android'de Block Store'da. Kullanıcı bir şey yapmaz. Native modül gerekir (config plugin).
- İsteğe bağlı **kurtarma kodu** (16 karakter base32 = 80 bit): scrypt → anahtar → private key sarılır → `kullanici.kurtarma_blob`. Sunucu blob'u açamaz.
- İkisi de yoksa ve telefon kaybolursa anılar kurtarılamaz. İlk defter açılınca bir kez sakin dille söylenir.

### Partner daveti
- Link: `doods.app/d/<token>#k=<defter anahtarı base64url>`. `#` sonrası sunucuya gitmez.
- Partner katılır → anahtarı kendi public key'iyle sarar → `POST /davet/:token/katil`.
- Token tek kullanımlık, 7 gün geçerli. Linki gören (mesajlaşma uygulaması dahil) anahtarı görür; tek kullanım bu riski daraltır.
- Üye çıkarılınca: yeni anahtar, eski dosyalar telefonda yeniden şifrelenir (v2; MVP'de sadece erişim kesilir).

### Açık kalanlar (bilinçli)
- Worker fotoğrafı birkaç saniye açık görür (Gemini için zorunlu).
- D1'de görünen: anı günü, defter türü, kim ekledi, sayılar. Takvim, seri ve fırça bunlara dayanır.
- Gizlilik metni: "Fotoğrafın çizim için Google'a gider, saklanmaz. Kayıtlı her şey uçtan uca şifreli; biz de göremeyiz."

## D1 şeması
```sql
CREATE TABLE kullanici (
  id TEXT PRIMARY KEY,              -- ulid
  public_key BLOB NOT NULL,
  apple_sub TEXT UNIQUE,            -- Sign in with Apple bağlanınca
  google_sub TEXT UNIQUE,
  kurtarma_blob BLOB,
  firca INTEGER NOT NULL DEFAULT 3, -- önbellek; gerçek kaynak firca_hareket
  abone_bitis INTEGER,              -- RevenueCat webhook
  olusturma INTEGER NOT NULL
);

CREATE TABLE defter (
  id TEXT PRIMARY KEY,
  sahip_id TEXT NOT NULL REFERENCES kullanici(id),
  tur TEXT NOT NULL,                -- sevgili|cocuk|evcil|aile|arkadas|baska
  ad_enc BLOB NOT NULL,             -- şifreli ad
  kapak_ani_id TEXT,
  olusturma INTEGER NOT NULL
);

CREATE TABLE uye (
  defter_id TEXT NOT NULL REFERENCES defter(id),
  kullanici_id TEXT NOT NULL REFERENCES kullanici(id),
  rol TEXT NOT NULL,                -- sahip|uye
  sarili_anahtar BLOB NOT NULL,
  katilma INTEGER NOT NULL,
  PRIMARY KEY (defter_id, kullanici_id)
);

CREATE TABLE ani (
  id TEXT PRIMARY KEY,
  defter_id TEXT NOT NULL REFERENCES defter(id),
  ekleyen_id TEXT NOT NULL REFERENCES kullanici(id),
  gun TEXT NOT NULL,                -- 2026-10-25 (EXIF tarihinden)
  not_enc BLOB,
  surum INTEGER NOT NULL DEFAULT 1, -- yeniden çizimde artar
  ucretsiz_tekrar INTEGER NOT NULL DEFAULT 1,
  durum TEXT NOT NULL,              -- yukleniyor|hazir
  olusturma INTEGER NOT NULL,
  silinme INTEGER
);
CREATE INDEX ani_takvim ON ani(defter_id, gun);

CREATE TABLE firca_hareket (
  id TEXT PRIMARY KEY,
  kullanici_id TEXT NOT NULL REFERENCES kullanici(id),
  delta INTEGER NOT NULL,           -- -1 çizim, +1 iade, +N paket/abonelik
  neden TEXT NOT NULL,              -- hediye|cizim|iade|telafi|paket|abonelik
  ref TEXT,                         -- ani_id veya RevenueCat işlem id
  zaman INTEGER NOT NULL
);

CREATE TABLE davet (
  token TEXT PRIMARY KEY,
  defter_id TEXT NOT NULL REFERENCES defter(id),
  olusturan_id TEXT NOT NULL,
  bitis INTEGER NOT NULL,
  kullanan_id TEXT
);

CREATE TABLE cihaz (
  kullanici_id TEXT NOT NULL REFERENCES kullanici(id),
  platform TEXT NOT NULL,           -- ios|android
  push_token TEXT NOT NULL,
  PRIMARY KEY (kullanici_id, push_token)
);
```

Fırça düşme atomik (D1 `batch`):
```sql
UPDATE kullanici SET firca = firca - 1 WHERE id = ? AND firca > 0;  -- changes = 0 ise 402
INSERT INTO firca_hareket (...) VALUES (..., -1, 'cizim', ...);
```
Abonelikte fırça ayrı mantık (aylık kota) – fiyat kararıyla netleşecek.

## R2 düzeni
```
d/{defter_id}/{ani_id}/o   orijinal (2048px JPEG, ~600KB)
d/{defter_id}/{ani_id}/c   çizim (WebP/PNG, ~300KB)
d/{defter_id}/{ani_id}/t   küçük çizim 256px (takvim, widget)
```
Hepsi şifreli. Presigned URL 10 dk. Worker üyelik kontrolü yapmadan URL vermez.

## API (Hono)
| Uç | İş |
|---|---|
| `POST /auth/anon` | public key al, kullanıcı + JWT dön, 3 fırça hediye |
| `POST /auth/apple` · `/auth/google` | hesabı bağla |
| `POST /ciz` | fırça düş, Gemini, PNG dön (saklamaz) |
| `POST /defter` | defter + sahibin sarılı anahtarı |
| `GET /defter` | üyesi olunan defterler + sarılı anahtarlar |
| `POST /ani` | satır + PUT URL'leri |
| `POST /ani/:id/tamam` | `hazir`, push |
| `GET /defter/:id/ani?ay=2026-10` | liste + GET URL'leri |
| `GET /defter/:id/yil?y=2026` | sadece günler (yıl haritası) |
| `DELETE /ani/:id` | işaretle, R2'den sil |
| `POST /davet` · `POST /davet/:token/katil` | ortak defter |
| `POST /webhook/revenuecat` | abonelik, paket → `firca_hareket` |

Auth: Worker imzalı JWT (HS256, 30 gün) + yenileme.

## Telefonda
- Çözülmüş küçük çizimler cache'te (`FileSystem.documentDirectory`). Widget App Group'tan okur.
- Yıl sonu görseli, paylaşım kartı telefonda üretilir (sunucu içeriği göremez).
- Galerideki asset ID tutulur → orijinal indirmeden önce yerelde aranır.

## Açık kararlar
- Partner fırçası: herkes kendi fırçası mı, abone partnerini de karşılar mı?
- Davet alan adı (`doods.app`?).
- Ek paket fiyatı.
- Üye çıkarmada yeniden şifreleme (v2).
