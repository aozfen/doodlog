# Çoklu Anı Takvimi Uygulaması --- Ürün Fikri ve MVP Planı

## 1. Fikir özeti

Tek bir uygulama içinde kullanıcının hayatındaki farklı alanlara ait
anıları fotoğraflardan oluşturulan doodle/illüstrasyonlarla
saklayabildiği kişisel bir anı platformu.

Temel yaklaşım:

**Fotoğraf → kişiselleştirilmiş çizim → tarih ve kısa not → koleksiyonda
birikim → takvimde görüntüleme → paylaşım**

Uygulama yalnızca çiftlere, ebeveynlere veya evcil hayvan sahiplerine
odaklanmaz. Bunların hepsini ve kullanıcının kendi belirlediği diğer
kategorileri kapsar.

Ürünün temel vaadi: **Hayatındaki bütün anıları tek yerde, farklı
koleksiyonlarda saklamak.**

## 2. Ürün yapısı

### Ana sayfa: Anılarım

Ana sayfada kullanıcının farklı anı koleksiyonları bulunur. Örnek
koleksiyonlar:

-   **Sevgilimle:** İlişki anıları, yıldönümleri ve birlikte geçirilen
    özel günler.
-   **Çocuğum:** Büyüme süreci, ilkler ve aylık gelişim anıları.
-   **Evcil hayvanım:** Sahiplenme günü, doğum günleri ve günlük anılar.
-   **Kendim ve hayatım:** Kişisel günlük, gündelik yaşam ve özel anlar.
-   **Seyahatlerim:** Geziler ve seyahat günlüğü.
-   **Özel koleksiyon:** Kullanıcının kendi isimlendirdiği kategoriler;
    örneğin "Yeni evimiz", "Üniversite yıllarım" veya "2026 anılarım".

Kullanıcı tek bir hesapla birden fazla koleksiyon oluşturabilir. Her
koleksiyonun kendine ait görsel kimliği ve takvim görünümü olabilir.

### Genel takvim

Koleksiyonlara ek olarak tüm anıların kronolojik biçimde bir arada
görülebildiği **Genel Takvim** bulunur.

Kullanıcı isterse yalnızca "Sevgilimle" koleksiyonunu açar, isterse
bütün hayatındaki anıları tek bir akışta görür.

Bu yapı iki ihtiyacı aynı anda karşılar:

1.  Anıları konuya göre düzenlemek.
2.  Hayatın tamamına geriye dönüp tek bir yerden bakabilmek.

## 3. Temel kullanıcı akışı

1.  Kullanıcı bir fotoğraf seçer.
2.  Fotoğrafı doodle/illüstrasyon tarzına dönüştürür.
3.  İsterse kısa bir not ekler.
4.  Anıyı tarihli olarak uygun koleksiyona kaydeder.
5.  Anı o koleksiyonun takviminde ve Genel Takvim'de görünür.
6.  Kullanıcı anıyı görsel olarak dışa aktarabilir ve sosyal medyada
    paylaşabilir.

İlk sürümün amacı karmaşık bir günlük uygulaması yaratmak değil; bir
fotoğrafı hızlıca kişisel, güzel ve paylaşılabilir bir anıya
dönüştürmektir.

## 4. Ürünün stratejik avantajı

### Pazarlamada niş, üründe genişlik

Ürün geniş bir kitleye hizmet ederken pazarlama iletişimi farklı
kullanıcı gruplarına göre özelleştirilebilir.

Örnek mesajlar:

-   **Çiftler:** "İlişkinizin her gününü bir anıya dönüştürün."
-   **Ebeveynler:** "Bebeğinin ilk yılını tek bir takvimde sakla."
-   **Evcil hayvan sahipleri:** "Onun büyüdüğü her anı sakla."
-   **Seyahat severler:** "Her gezini kişisel bir anı günlüğüne
    dönüştür."

Her reklam veya kampanya, kullanıcıyı ilgili koleksiyonun tanıtımına ya
da oluşturma akışına yönlendirebilir. Kullanıcı uygulamaya bir niş
üzerinden girse de daha sonra başka koleksiyonlar ekleyebilir.

Böylece her niş için ayrı uygulama geliştirmek gerekmez. Aynı çekirdek
ürün, farklı mesajlar ve temalarla farklı kitlelere sunulur.

## 5. Gelir modeli: Fırça

Gelir tek bir birime dayanır: **fırça**. Her çizim 1 fırça harcar.
Koleksiyonlar, takvim ve paylaşım ücretsizdir; kullanıcı istediği kadar
koleksiyon açar ve anı ekler. Para yalnızca çizim, yani yapay zeka
maliyeti olan iş için alınır.

### Fırça kuralları

-   1 çizim = 1 fırça.
-   Yeni kullanıcıya başlangıçta 5--10 bedava fırça verilir (kesin sayı
    test edilecek).
-   Çizimi beğenmeyen kullanıcı için ilk "tekrar dene" bedava olabilir
    (rakipte de "Retry" var).
-   Fırça kullanıcıya hiçbir ekstra adım çıkarmaz: fotoğraf seçilir,
    1 fırça düşer, çizim gelir.

### Abonelik (26 Ekim 2026 kararı)

-   **Aylık: $7,99**, ayda 50 fırça.
-   **Yıllık: $59,99**, ayda 50 fırça. Aylığa göre %37 indirim
    ("ayda sadece $5").
-   İki planda fırça sayısı aynıdır; fark yalnızca fiyattadır.
-   Abonelik fırçaları her ay yenilenir, kullanılmayanlar sonraki aya
    devretmez.
-   Maliyet yükselirse fırça sayısı 45'e indirilebilir.

### Ek fırça paketleri (öneri)

-   Paketler herkese satılır: abone olan ve olmayan kullanıcılara.
-   Paket fiyatı aboneliği yememeli. Fırça başı fiyat, abonelikteki
    fırça başı fiyatın (~$0,16) en az 2,5 katı olmalı.
-   **10 fırça: $4,99** ($0,50/fırça).
-   **20 fırça: $7,99** ($0,40/fırça). Aylık abonelikle aynı fiyat;
    ekranda "Aynı fiyata abonelikle her ay 50 fırça" diye gösterilir.
-   Satın alınan fırçaların süresi dolmaz. Önce abonelik fırçaları,
    sonra paket fırçaları harcanır.

### Fırça bitti ekranı (26 Ekim 2026 kararı)

Bu ekran ceza gibi değil, değer gösteren bir ekran olmalı. "Hakkınız
bitti" gibi bir metin kullanılmaz.

-   Üstte "Bu ay 50 anı çizdin" yazar ve o ayın çizimlerinden bir
    kolaj gösterilir. Kullanıcı ne aldığını görür.
-   Yenilenme tarihi yazar: "Fırçaların 1 Kasım'da yenilenir."
    Beklemek de geçerli bir seçenek olarak sunulur.
-   Ardından paketler: 10 fırça $4,99, 20 fırça $7,99.
-   Aylık abonelere ek olarak "Yıllığa geç" seçeneği gösterilir.
-   Fırça sayacını gizleme fikri reddedildi: sürpriz limit ceza gibi
    hissettirir ve paket satmaz.

### Maliyet hesabı

-   Model: Google Nano Banana 2.1 (`gemini-nano-banana-2.1`), çizim
    başına ~$0,034.
-   Fotoğraf girdisi, tekrar denemeler ve sunucu dahil, 1 fırçanın
    maliyeti ~$0,05 varsayıldı.
-   Fiyat (Ekim 2026): girdi $1,50 / 1M token, görsel çıktı $30 / 1M
    token. 1K görsel 1.120 token, yani ~$0,034. Fotoğraf ve karakter
    kartları girdi tokenı olarak ayrıca ücretlenir.
-   Gerçek tutar her çağrıda `gemini_cagri` tablosuna yazılır
    (MIMARI.md, Maliyet takibi). $0,05 varsayımı bu verilerle
    güncellenir.
-   Arka plan kesme cihazda (Apple Vision) yapılıyor, ücretsiz.
-   Mağaza payı %15 (Small Business Program) ve devlet vergisi %15
    düşülünce satış fiyatının ~%70'i ele geçer.
-   Aylık planda net gelir ~$5,59. 50 fırçanın tamamını harcayan
    kullanıcının maliyeti en fazla $2,50 (kâr ~$3,09). Ortalama
    kullanıcının (~15 fırça) maliyeti ~$0,75.
-   Yıllık planda aylık ortalama net gelir ~$3,50. 50 fırçanın tamamını
    harcayan kullanıcının maliyeti en fazla $2,50 (kâr ~$1,00).
-   Yıllık planda başa baş noktası fırça başı ~$0,07. 45 fırçada bu
    nokta ~$0,078 olur.
-   Paketlerde kâr: 10 fırça ~$2,99, 20 fırça ~$4,59.

### Rakip

DOOD -- Doodle Photo Journal (Far Far Away Co., Ltd.): aylık $5,99,
yıllık $49,99. Abonelikteki çizim limiti bilinmiyor. Kredi sistemi
yok: 1 ücretsiz çizimden sonra abonelik istiyor. Gizlilik politikasına
göre (3 Eylül 2026): görsel üretimde OpenAI, analitikte Amplitude
kullanıyor; hesap yok, tüm veri sadece cihazda duruyor. Tek fotoğrafı
tek çizime çeviriyor, karakter tutarlılığı ve koleksiyon yok gibi
görünüyor.

### Notlar

-   Rakibin üzerinde fiyatlamanın gerekçesi ürün farkı olmalı: çoklu
    koleksiyon, karakter tutarlılığı ve muhtemelen eş/aile paylaşımı.
    Paylaşım henüz karar verilmiş bir özellik değil (bkz. Bölüm 11).
-   $9,99 aylık ve $69,99 yıllık ileride RevenueCat gibi bir araçla
    A/B testi yapılarak denenebilir.
-   Türkiye mağazası için TL fiyatı ayrıca belirlenmeli.
-   Model fiyatı değişirse veya 2.1 kapatılırsa hesap yeniden
    yapılmalı.

## 6. Kullanıcıdan zaman içinde daha fazla değer elde etme

Ürün, kullanıcının hayatındaki yeni aşamalarla birlikte daha değerli
hâle gelebilir.

Örnek yolculuk:

1.  Kullanıcı uygulamayı sevgilisiyle yaşadığı anıları saklamak için
    indirir.
2.  İlgili koleksiyonu oluşturur ve abonelik alır.
3.  Daha sonra evcil hayvanı için yeni bir koleksiyon açar.
4.  İlerleyen yıllarda çocuğu, seyahatleri veya yeni evi için
    koleksiyonlar oluşturur.

Bu, her yeni yaşam aşamasında uygulamanın yeniden değer kazanması için
fırsat yaratır. Kullanıcının tekrar tekrar yeni uygulama indirmesi
gerekmez.

Her yeni koleksiyon daha fazla anı, yani daha fazla fırça kullanımı
demektir; gelir koleksiyon sayısından değil çizimden gelir.

## 7. İlk sürüm (MVP) --- geliştirme kapsamı

İlk sürümde on farklı niş için birbirinden ayrı özellikler geliştirmek
yerine, tüm kategorilerin kullanabileceği ortak bir çekirdek
oluşturulmalı.

### 7.1. Ortak çekirdek

-   Fotoğraf seçme/yükleme.
-   Fotoğrafı doodle veya illüstrasyon tarzına dönüştürme.
-   Anıya kısa not ekleme.
-   Anıya tarih atama.
-   Anıyı kaydetme.
-   Görseli dışa aktarma ve paylaşma.

### 7.2. Koleksiyon sistemi

-   Başlangıçta hazır kategoriler: Sevgilimle, Çocuğum, Evcil hayvanım,
    Kendim ve hayatım.
-   Kullanıcının özel koleksiyon oluşturabilmesi.
-   Koleksiyon adı ve kapak görseli.
-   Anıyı bir koleksiyona ekleme.
-   Koleksiyon içindeki anıları listeleme veya takvimde görüntüleme.

### 7.3. Genel takvim

-   Bütün koleksiyonlardaki anıları tarih sırasıyla bir arada gösterme.
-   Bir anının hangi koleksiyona ait olduğunu belirtme.
-   İstenirse belirli bir koleksiyona göre filtreleme.

### 7.4. Nişe özel tasarımlar

İlk sürümde her niş için ayrı bir ürün akışı geliştirmek yerine ortak
tasarım altyapısı kullanılmalı. Farklılıklar başlangıçta şu öğelerle
sağlanabilir:

-   Kapaklar ve görsel temalar.
-   Hazır şablonlar.
-   Paylaşım görselleri ve kolaj düzenleri.
-   Koleksiyon başlıkları ve küçük metin/deneyim farklılıkları.

### 7.5. Fırça, abonelik ve ölçümleme

-   Fırça bakiyesi (başlangıçta bedava fırça).
-   Aylık ve yıllık abonelik, ek fırça paketi.
-   Koleksiyon oluşturma, ilk anıyı kaydetme, tekrar kullanım ve satın
    alma olaylarının ölçümlenmesi.

## 8. İlk sürümde özellikle yapılmaması gerekenler

MVP'nin kapsamını kontrol altında tutmak için başlangıçta şunlardan
kaçınılmalı:

-   Her niş için tamamen farklı uygulama akışları geliştirmek.
-   Çok sayıda gelişmiş sosyal özellik eklemek.
-   Koleksiyon, niş veya tema başına ayrı ücretlendirme kurmak.
-   Ürün değerini doğrulamadan karmaşık bir widget, baskı veya fiziksel
    albüm sistemi geliştirmek.

Öncelik, kullanıcının fotoğrafı kolayca anıya dönüştürmesi, bunu
koleksiyonunda biriktirmesi ve yeniden kullanmak için uygulamaya
dönmesidir.

## 9. Pazarlama ve doğrulama planı

İlk pazarlama testinde en az üç ayrı kreatif yaklaşım denenebilir:

1.  Çiftler.
2.  Ebeveynler.
3.  Evcil hayvan sahipleri.

Her biri için farklı mesaj ve örnek çıktı kullanılmalı. Değerlendirme
yalnızca indirme sayısına göre yapılmamalı.

İzlenebilecek metrikler:

-   Reklam tıklama oranı.
-   İndirme başına maliyet.
-   İlk koleksiyon oluşturma oranı.
-   İlk anıyı kaydetme oranı.
-   Kullanıcının sonraki günlerde yeniden gelmesi.
-   Abonelik ekranını görüntüleme ve satın alma oranı.
-   Fırçası biten kullanıcıların satın alma oranı.
-   Ödeme yapan kullanıcı başına edinme maliyeti.
-   Kullanıcı başına oluşturulan koleksiyon ve anı sayısı.

Hangi nişin daha çok indirme getirdiğinden ziyade, hangi nişin daha
yüksek kaliteli ve ödeme yapmaya istekli kullanıcılar getirdiği
araştırılmalı.

## 10. Temel ürün prensibi

**Pazarlamada niş, üründe genişlik.**

Kullanıcıya kendisiyle ilgili, duygusal ve net bir vaatle ulaşılır.
Ancak uygulamanın içinde farklı anı kategorilerini bir arada
yönetebileceği ortak bir sistem sunulur.

Ürünün temel farklılaştırıcısı yalnızca fotoğrafı çizime dönüştürmek
değildir. Asıl değer:

**Fotoğraf → kişisel anı → koleksiyonda birikim → takvim → paylaşım →
tekrar kullanım**

Bu akışın zaman içinde alışkanlığa dönüşmesi ve kullanıcının hayatındaki
yeni aşamalarla daha değerli hâle gelmesi hedeflenir.

## 11. Açık kalan kararlar

Geliştirmeye başlamadan önce doğrulanması gereken konular:

-   ~~Fotoğrafı çizime dönüştürmek için hangi model veya servis
    kullanılacak?~~ Karar: Nano Banana 2.1 (test sonuçları `test/`).
-   Başlangıçta kaç bedava fırça verilecek? (Maliyet belli: ~$0,05/fırça.)
-   ~~Gelir modeli ve abonelik fiyatı~~ Karar: fırça modeli, $7,99/ay
    ve $59,99/yıl, iki planda da ayda 50 fırça (Bölüm 5).
-   Ek fırça paketinin fiyatı ne olacak? Öneri: 10 fırça $4,99,
    20 fırça $7,99, herkese açık (Bölüm 5).
-   App Store Connect'te W-8BEN vergi formu doldurulmuş mu? Formu
    doldurmayan geliştiricinin ABD satışlarından Apple ek vergi
    kesebilir. Türkiye-ABD vergi anlaşmasıyla bu kesinti düşer.
-   Kullanıcılar koleksiyonlarını başkalarıyla ortak kullanabilecek mi?
-   Veriler, fotoğraflar ve anılar nasıl yedeklenecek ve korunacak?
-   İlk pazarlama testinde hangi nişin ödeme dönüşümü daha yüksek
    olacak?

Bu kararlar MVP'nin kapsamı, teknik maliyeti ve ilk pazarlama
testlerinin sonuçları doğrultusunda netleştirilmeli.

------------------------------------------------------------------------

## Kısa sonuç

Tek bir anı uygulaması geliştir; kullanıcıların hayatlarının farklı
alanları için ayrı takvimler oluşturmasına izin ver. Tüm anıları Genel
Takvim'de birleştir. Nişlere özel reklamlar ve temalarla farklı
kitlelere ulaş; geliri tek birimden, fırçadan al: her çizim 1 fırça.

İlk sürümde odağı dağıtma: **ortak fotoğraf-doodle akışı, koleksiyonlar,
Genel Takvim, paylaşım, fırça modeli ve doğru ölçümleme.**
