# doods tema (A v2)

Kaynak: `a.css` + `a2.css` + `a-ui.css`. React Native'e geçerken bu kurallar esas.

## İlke
Çizim kahraman, arayüz geri planda. Renk az, dokunulabilir şey kabarık, el yazısı imza gibi tek.

## Renk
| Token | Değer | Kullanım |
|---|---|---|
| bg | `#f7f5f0` | Ekran zemini |
| surface | `#fffdf7` | Kart, defter, alan |
| edge | `#e2dbcd` | 3B alt kalınlık (açık yüzey) |
| line | `#ebe5d9` | Düz kart kenarı |
| empty | `#efebe3` | Boş takvim günü |
| ink | `#161616` | Metin, koyu buton, alt bar (2026-10-26: mor tonlu `#2a2733` yerine nötr) |
| ink-top | `#3b3a3e` | Koyu buton gradyan üstü |
| ink-edge | `#000000` | Koyu buton kalınlığı |
| red | `#c9533a` | Tek vurgu: bugün, fırça, "1 yıl önce", rozet |
| mute | ink %55 | İkincil metin |

Pastel blok yok, sol renkli şerit yok, koyu tema yok. Renk sadece içerikten (çizimler) gelir.

## Yazı
- **Caveat 700**: ekran başına tek başlık (Merhaba Ahmet, defter adı, akış başlığı). 34–48px.
- **Nunito**: geri kalan her şey. Bölüm başlığı 20/800, not 16/700, alt metin 13/700 %55, etiket 11/800 harf aralığı .06em büyük harf.
- 18px altında Caveat yok.

## 3B
- Blur gölge yok. Üstten hafif açık degrade + üstte 1–1.5px beyaz parlama + altta sert kalınlık.
- Kalınlık: kart/defter 5px, küçük parça (chip, etiket, ikon buton) 3px, koyu buton 5px.
- **Sadece basılabilen şey kabarık.** Bilgi kartı düz (`flat`: surface + 1.5px line).
- Basınca 3px aşağı iner, kalınlık kaybolur.
- RN: her bileşenin altına kalınlık renginde ikinci `View` (translateY), ya da `borderBottomWidth`.

## Biçim
- Köşe: kart 28, defter 18, buton 28 (hap), chip 20, takvim günü 10.
- Boşluk: 8'in katları. Ekran kenarı 20.
- Çıkartma: çizim etrafında 2.5px beyaz kesim kenarı + hafif gölge (çizime ait, arayüze değil). Kart dışına taşabilir.

## Parçalar
- **Alt bar**: koyu yüzen hap, ortada açık "Anı ekle", yanlarda yazılı Defterler / Takvim. Arkasında zemine geçiş.
- **Buton**: birincil koyu (`btn`), ikincil açık (`btn2`). Tam genişlik, 56px.
- **Takvim günü**: boş = düz çukur; dolu = kabarık, çizim kesiti (yüze ortalı), numara köşede rozet; bugün = kırmızı kenar.
- **Sheet**: alttan, 32 köşe, tutamak.

## Hareket
- Sakin yay, zıplama az. Çizim gelişi `pop` (0.7s), takvime yapışma, boyama maskesi.
- Basışta hafif titreşim (haptic). Konfeti yok.

## Dil
Sıcak ama yetişkin. Ünlem ve "Yaşasın" yok. Sıkıştırma yok ("Daha sonra" hep var). Kısa cümle.

## Kişiselleştirme
İlk defter seçimi (niş) sonraki her metni, örneği ve ipucunu değiştirir. Tablo: `a-onboarding.html` içindeki `N`.
