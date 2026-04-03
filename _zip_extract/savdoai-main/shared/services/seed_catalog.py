"""
SAVDOAI — TAYYOR TOVAR BAZALARI v2
BUTUN O'ZBEKISTON BOZORI — 15 segment | 1000+ tovar
"""
from __future__ import annotations
import logging
log = logging.getLogger(__name__)

_KIMYOVIY = [
    ("Ariel 3kg","Kimyoviy: Kir yuvish","dona"),("Ariel 6kg","Kimyoviy: Kir yuvish","dona"),
    ("Ariel 450g","Kimyoviy: Kir yuvish","dona"),("Persil 3kg","Kimyoviy: Kir yuvish","dona"),
    ("Persil 6kg","Kimyoviy: Kir yuvish","dona"),("Persil gel 1L","Kimyoviy: Kir yuvish","dona"),
    ("Tide 3kg","Kimyoviy: Kir yuvish","dona"),("Tide 6kg","Kimyoviy: Kir yuvish","dona"),
    ("Omo 3kg","Kimyoviy: Kir yuvish","dona"),("Sarma 3kg","Kimyoviy: Kir yuvish","dona"),
    ("Bimax 3kg","Kimyoviy: Kir yuvish","dona"),("Losk 3kg","Kimyoviy: Kir yuvish","dona"),
    ("Biolan 3kg","Kimyoviy: Kir yuvish","dona"),("AOS gel 1L","Kimyoviy: Kir yuvish","dona"),
    ("Fairy 450ml","Kimyoviy: Idish yuvish","dona"),("Fairy 900ml","Kimyoviy: Idish yuvish","dona"),
    ("Pril 450ml","Kimyoviy: Idish yuvish","dona"),("AOS 450ml","Kimyoviy: Idish yuvish","dona"),
    ("Sorti 450ml","Kimyoviy: Idish yuvish","dona"),("Dozor 450ml","Kimyoviy: Idish yuvish","dona"),
    ("Domestos 1L","Kimyoviy: Tozalash","dona"),("Bref gel","Kimyoviy: Tozalash","dona"),
    ("Cillit Bang","Kimyoviy: Tozalash","dona"),("Mr.Proper 1L","Kimyoviy: Tozalash","dona"),
]
_GIGIYENA = [
    ("Head&Shoulders 400ml","Gigiyena: Shampun","dona"),("Pantene 400ml","Gigiyena: Shampun","dona"),
    ("Clear 400ml","Gigiyena: Shampun","dona"),("Dove shampun 400ml","Gigiyena: Shampun","dona"),
    ("Safeguard","Gigiyena: Sabun","dona"),("Camay","Gigiyena: Sabun","dona"),
    ("Dove sabun","Gigiyena: Sabun","dona"),("Duru","Gigiyena: Sabun","dona"),
    ("Colgate 100ml","Gigiyena: Tish pastasi","dona"),("Blend-a-med 100ml","Gigiyena: Tish pastasi","dona"),
    ("Pampers 3","Gigiyena: Taglik","dona"),("Pampers 4","Gigiyena: Taglik","dona"),
    ("Pampers 5","Gigiyena: Taglik","dona"),("Huggies 3","Gigiyena: Taglik","dona"),
    ("Huggies 4","Gigiyena: Taglik","dona"),("Molfix 4","Gigiyena: Taglik","dona"),
    ("Zewa 4 dona","Gigiyena: Qog'oz","dona"),("Familia 4 dona","Gigiyena: Qog'oz","dona"),
    ("Obuxov 4 dona","Gigiyena: Qog'oz","dona"),("Selpak 3 dona","Gigiyena: Qog'oz","dona"),
]
_OZIQ_OVQAT = [
    ("Un 1-sort 50kg","Oziq-ovqat: Un","qop"),("Un v/s 50kg","Oziq-ovqat: Un","qop"),
    ("Guruch Lazer","Oziq-ovqat: Guruch","kg"),("Guruch Dev'zira","Oziq-ovqat: Guruch","kg"),
    ("Makaron Barilla","Oziq-ovqat: Makaron","dona"),("Makaron Makfa","Oziq-ovqat: Makaron","dona"),
    ("Spagetti","Oziq-ovqat: Makaron","dona"),("Vermishel","Oziq-ovqat: Makaron","dona"),
    ("Oltin Yog' 1L","Oziq-ovqat: Yog'","dona"),("Oltin Yog' 5L","Oziq-ovqat: Yog'","dona"),
    ("Sariyog' 200g","Oziq-ovqat: Yog'","dona"),("Toshkent suti 1L","Sut mahsuloti","dona"),
    ("Qatiq 1L","Sut mahsuloti","dona"),("Smetana 200g","Sut mahsuloti","dona"),
    ("Pishloq 1kg","Sut mahsuloti","kg"),("Tuxum 30 dona","Sut mahsuloti","dona"),
    ("Tuxum 10 dona","Sut mahsuloti","dona"),("Shakar 1kg","Oziq-ovqat: Shakar","kg"),
    ("Shakar 50kg","Oziq-ovqat: Shakar","qop"),("Tuz 1kg","Oziq-ovqat: Tuz","kg"),
    ("Pomidor pasta 800g","Oziq-ovqat: Konserva","dona"),
    ("Zira 100g","Oziq-ovqat: Ziravor","dona"),("Qalampir 50g","Oziq-ovqat: Ziravor","dona"),
]
_ICHIMLIK = [
    ("Coca-Cola 1.5L","Ichimlik: Gazli","dona"),("Coca-Cola 0.5L","Ichimlik: Gazli","dona"),
    ("Fanta 1.5L","Ichimlik: Gazli","dona"),("Sprite 1.5L","Ichimlik: Gazli","dona"),
    ("Pepsi 1.5L","Ichimlik: Gazli","dona"),("Pepsi 0.5L","Ichimlik: Gazli","dona"),
    ("Nestle suv 1.5L","Ichimlik: Suv","dona"),("Nestle suv 5L","Ichimlik: Suv","dona"),
    ("Lipton Ice Tea 1L","Ichimlik: Sharbat","dona"),("Rich sok 1L","Ichimlik: Sharbat","dona"),
    ("Choy Ahmad 100g","Ichimlik: Choy","dona"),("Choy Tess 100g","Ichimlik: Choy","dona"),
    ("Ko'k choy 100g","Ichimlik: Choy","dona"),("Nescafe 3in1","Ichimlik: Qahva","dona"),
    ("Nescafe Gold 95g","Ichimlik: Qahva","dona"),
]
_SHIRINLIK = [
    ("Snickers","Shirinlik: Shokolad","dona"),("Mars","Shirinlik: Shokolad","dona"),
    ("Twix","Shirinlik: Shokolad","dona"),("KitKat","Shirinlik: Shokolad","dona"),
    ("Alpen Gold","Shirinlik: Shokolad","dona"),("Milka 100g","Shirinlik: Shokolad","dona"),
    ("Lays chips","Shirinlik: Snack","dona"),("Cheetos","Shirinlik: Snack","dona"),
    ("Pringles","Shirinlik: Snack","dona"),("Xalva 1kg","Shirinlik: Xalva","kg"),
    ("Navot 1kg","Shirinlik: Navot","kg"),("Parvarda 1kg","Shirinlik: Konfet","kg"),
]
_OSHXONA = [
    ("Osh","Oshxona: Taom","dona"),("Palov","Oshxona: Taom","dona"),
    ("Shashlik mol","Oshxona: Kabob","dona"),("Shashlik tovuq","Oshxona: Kabob","dona"),
    ("Lyulya kabob","Oshxona: Kabob","dona"),("Jigar kabob","Oshxona: Kabob","dona"),
    ("Somsa mol","Oshxona: Somsa","dona"),("Somsa tovuq","Oshxona: Somsa","dona"),
    ("Somsa tandir","Oshxona: Somsa","dona"),("Lag'mon","Oshxona: Taom","dona"),
    ("Norin","Oshxona: Taom","dona"),("Shorva","Oshxona: Taom","dona"),
    ("Chuchvara","Oshxona: Taom","dona"),("Mastava","Oshxona: Taom","dona"),
    ("Manti","Oshxona: Taom","dona"),("Dimlama","Oshxona: Taom","dona"),
    ("Do'lma","Oshxona: Taom","dona"),("Non","Oshxona: Non","dona"),
    ("Patir non","Oshxona: Non","dona"),("Obi non","Oshxona: Non","dona"),
    ("Salat osh","Oshxona: Salat","dona"),("Choy qora","Oshxona: Ichimlik","dona"),
    ("Choy ko'k","Oshxona: Ichimlik","dona"),("Kompot","Oshxona: Ichimlik","dona"),
    ("Mol go'sht","Xom ashyo","kg"),("Tovuq go'sht","Xom ashyo","kg"),
    ("Kartoshka","Xom ashyo","kg"),("Piyoz","Xom ashyo","kg"),
    ("Sabzi","Xom ashyo","kg"),("Pomidor","Xom ashyo","kg"),("Yog' 5L","Xom ashyo","dona"),
]
_KIYIM = [
    ("Futbolka erkak","Kiyim: Erkak","dona"),("Futbolka ayol","Kiyim: Ayol","dona"),
    ("Shim erkak","Kiyim: Erkak","dona"),("Shim ayol","Kiyim: Ayol","dona"),
    ("Ko'ylak erkak","Kiyim: Erkak","dona"),("Ko'ylak ayol","Kiyim: Ayol","dona"),
    ("Kurtka erkak","Kiyim: Erkak","dona"),("Kurtka ayol","Kiyim: Ayol","dona"),
    ("Sportivka erkak","Kiyim: Erkak","dona"),("Sportivka ayol","Kiyim: Ayol","dona"),
    ("Kostyum erkak","Kiyim: Erkak","dona"),("Palto ayol","Kiyim: Ayol","dona"),
    ("Jins shim","Kiyim: Jins","dona"),("Bola futbolka","Kiyim: Bolalar","dona"),
    ("Bola shim","Kiyim: Bolalar","dona"),("Bola kurtka","Kiyim: Bolalar","dona"),
    ("Paypoq erkak","Kiyim: Ichki kiyim","juft"),("Paypoq ayol","Kiyim: Ichki kiyim","juft"),
    ("Tufli erkak","Kiyim: Poyabzal","juft"),("Tufli ayol","Kiyim: Poyabzal","juft"),
    ("Krossovka","Kiyim: Poyabzal","juft"),("Shapka","Kiyim: Aksessuar","dona"),
    ("Sumka ayol","Kiyim: Aksessuar","dona"),("Kamar","Kiyim: Aksessuar","dona"),
]
_GOSHT = [
    ("Mol go'sht","Go'sht: Mol","kg"),("Mol dumba","Go'sht: Mol","kg"),
    ("Mol jigar","Go'sht: Mol","kg"),("Mol yurak","Go'sht: Mol","kg"),
    ("Mol tili","Go'sht: Mol","kg"),("Mol suyak","Go'sht: Mol","kg"),
    ("Mol qovurg'a","Go'sht: Mol","kg"),("Mol filey","Go'sht: Mol","kg"),
    ("Qo'y go'sht","Go'sht: Qo'y","kg"),("Qo'y dumba","Go'sht: Qo'y","kg"),
    ("Qo'y jigar","Go'sht: Qo'y","kg"),("Tovuq butun","Go'sht: Tovuq","dona"),
    ("Tovuq son","Go'sht: Tovuq","kg"),("Tovuq filey","Go'sht: Tovuq","kg"),
    ("Tovuq qanot","Go'sht: Tovuq","kg"),("Baliq karb","Go'sht: Baliq","kg"),
    ("Kolbasa doktorskaya","Go'sht: Kolbasa","kg"),("Sosiska","Go'sht: Kolbasa","kg"),
    ("Qazi","Go'sht: Qazi","kg"),("Xasip","Go'sht: Qazi","kg"),
]
_MEVA_SABZAVOT = [
    ("Kartoshka","Sabzavot","kg"),("Piyoz","Sabzavot","kg"),("Sabzi","Sabzavot","kg"),
    ("Pomidor","Sabzavot","kg"),("Bodring","Sabzavot","kg"),("Baqlajon","Sabzavot","kg"),
    ("Bolgar qalampir","Sabzavot","kg"),("Karam","Sabzavot","kg"),("Sarimsoq","Sabzavot","kg"),
    ("Tarvuz","Meva","kg"),("Qovun","Meva","kg"),("Olma","Meva","kg"),
    ("Nok","Meva","kg"),("Anor","Meva","kg"),("Uzum","Meva","kg"),
    ("Banan","Meva","kg"),("Apelsin","Meva","kg"),("Limon","Meva","kg"),
    ("Shaftoli","Meva","kg"),("Gilos","Meva","kg"),
    ("Mayiz","Quruq meva","kg"),("Yong'oq","Quruq meva","kg"),
    ("Bodom","Quruq meva","kg"),("Pistashka","Quruq meva","kg"),
]
_QURILISH = [
    ("Sement M400 50kg","Qurilish: Sement","qop"),("Sement M500 50kg","Qurilish: Sement","qop"),
    ("Shag'al","Qurilish: Qum","m3"),("Qum","Qurilish: Qum","m3"),
    ("G'isht qizil","Qurilish: G'isht","dona"),("G'isht oq","Qurilish: G'isht","dona"),
    ("Penoblok","Qurilish: Blok","dona"),("Gazoblok","Qurilish: Blok","dona"),
    ("Armatora 12mm","Qurilish: Metall","metr"),("Armatora 10mm","Qurilish: Metall","metr"),
    ("Sim 3mm","Qurilish: Metall","kg"),("Truba 20mm","Qurilish: Truba","metr"),
    ("Truba 32mm","Qurilish: Truba","metr"),("Truba 50mm","Qurilish: Truba","metr"),
    ("Kabel 2x2.5","Qurilish: Elektr","metr"),("Rozetka","Qurilish: Elektr","dona"),
    ("Kraska 3kg","Qurilish: Bo'yoq","dona"),("Kraska 10kg","Qurilish: Bo'yoq","dona"),
    ("Shpaklyovka 5kg","Qurilish: Pardoz","dona"),("Shtukaturka 25kg","Qurilish: Pardoz","qop"),
    ("Gruntovka 5L","Qurilish: Pardoz","dona"),("Oboi vinil","Qurilish: Pardoz","rulon"),
    ("Laminat","Qurilish: Pol","m2"),("Kafel","Qurilish: Pol","m2"),
    ("Plitka devor","Qurilish: Devor","m2"),("Gips karton","Qurilish: Devor","dona"),
]
_AVTO = [
    ("Moy motor 4L","Avto: Moy","dona"),("Moy motor 1L","Avto: Moy","dona"),
    ("Filtr moy","Avto: Filtr","dona"),("Filtr havo","Avto: Filtr","dona"),
    ("Filtr yoqilg'i","Avto: Filtr","dona"),("Filtr salon","Avto: Filtr","dona"),
    ("Kolodka old","Avto: Tormoz","komplekt"),("Kolodka orqa","Avto: Tormoz","komplekt"),
    ("Disk tormoz","Avto: Tormoz","dona"),("Svecha zajiganiya","Avto: Elektr","dona"),
    ("Akkumulyator 60Ah","Avto: Elektr","dona"),("Akkumulyator 75Ah","Avto: Elektr","dona"),
    ("Lampochka H4","Avto: Elektr","dona"),("Lampochka H7","Avto: Elektr","dona"),
    ("Antifriz 5L","Avto: Suyuqlik","dona"),("Tormoz suyuqlik","Avto: Suyuqlik","dona"),
    ("Remen GRM","Avto: Dvigatel","dona"),("Pompa suv","Avto: Dvigatel","dona"),
    ("Shinalar R15","Avto: Shina","dona"),("Shinalar R16","Avto: Shina","dona"),
]
_DORIXONA = [
    ("Paratsetamol 500mg","Dori: Og'riq","dona"),("Ibuprofen 400mg","Dori: Og'riq","dona"),
    ("Analgin","Dori: Og'riq","dona"),("No-shpa","Dori: Og'riq","dona"),
    ("Aktivirovanniy ugol","Dori: Oshqozon","dona"),("Mezim forte","Dori: Oshqozon","dona"),
    ("Omez 20mg","Dori: Oshqozon","dona"),("Smekta","Dori: Oshqozon","dona"),
    ("Amoksitsillin","Dori: Antibiotik","dona"),("Azitromitsin","Dori: Antibiotik","dona"),
    ("Tsetirizin","Dori: Allergiya","dona"),("Loratadin","Dori: Allergiya","dona"),
    ("Vitamin C","Dori: Vitamin","dona"),("Vitamin D3","Dori: Vitamin","dona"),
    ("Bint steril","Dori: Bog'lam","dona"),("Plastir","Dori: Bog'lam","dona"),
    ("Vata 50g","Dori: Bog'lam","dona"),("Termometr","Dori: Asbob","dona"),
    ("Maska medisin","Dori: Himoya","dona"),("Spirt 100ml","Dori: Antiseptik","dona"),
    ("Yod 25ml","Dori: Antiseptik","dona"),
]
_TEXNIKA = [
    ("Samsung telefon","Texnika: Telefon","dona"),("Xiaomi telefon","Texnika: Telefon","dona"),
    ("iPhone","Texnika: Telefon","dona"),("Chexol telefon","Texnika: Aksessuar","dona"),
    ("Steklo himoya","Texnika: Aksessuar","dona"),("Naushnik simli","Texnika: Aksessuar","dona"),
    ("Naushnik Bluetooth","Texnika: Aksessuar","dona"),("Zaryadka Type-C","Texnika: Aksessuar","dona"),
    ("Zaryadka iPhone","Texnika: Aksessuar","dona"),("Powerbank 10000","Texnika: Aksessuar","dona"),
    ("Fleshka 32GB","Texnika: Aksessuar","dona"),("Fleshka 64GB","Texnika: Aksessuar","dona"),
    ("Samsung TV 43","Texnika: TV","dona"),("Printer HP","Texnika: Kompyuter","dona"),
]
_MEBEL = [
    ("Shkaf 3 eshik","Mebel: Shkaf","dona"),("Shkaf kupe","Mebel: Shkaf","dona"),
    ("Krovat 2 kishilik","Mebel: Krovat","dona"),("Matras 2 kishilik","Mebel: Krovat","dona"),
    ("Divan","Mebel: Divan","dona"),("Kreslo","Mebel: Divan","dona"),
    ("Stol oshxona","Mebel: Stol","dona"),("Stol kompyuter","Mebel: Stol","dona"),
    ("Stul oshxona","Mebel: Stul","dona"),("Stul ofis","Mebel: Stul","dona"),
    ("Tumba TV","Mebel: Tumba","dona"),("Ko'zgu","Mebel: Aksessuar","dona"),
]
_MATO = [
    ("Atlas","Mato: Ip","metr"),("Shoyi","Mato: Ip","metr"),("Adras","Mato: Ip","metr"),
    ("Xan-atlas","Mato: Ip","metr"),("Krep","Mato: Sintetik","metr"),
    ("Shifon","Mato: Sintetik","metr"),("Jins mato","Mato: Jins","metr"),
    ("Trikotaj","Mato: Trikotaj","metr"),("Pardoz mato","Mato: Parda","metr"),
    ("Tyul","Mato: Parda","metr"),("Ip","Mato: Asbob","dona"),
    ("Tugma","Mato: Asbob","dona"),("Zamok molniya","Mato: Asbob","dona"),
]
_GUL = [
    ("Atirgul qizil","Gul: Atirgul","dona"),("Atirgul oq","Gul: Atirgul","dona"),
    ("Xrizantema","Gul","dona"),("Liliya","Gul","dona"),("Tyulpan","Gul","dona"),
    ("Gerber","Gul","dona"),("Buket kichik","Gul: Buket","dona"),
    ("Buket katta","Gul: Buket","dona"),("Buket premium","Gul: Buket","dona"),
    ("Guldon","Gul: Aksessuar","dona"),("Lenta","Gul: Aksessuar","dona"),
]
_KOSMETIKA = [
    ("Krem yuz","Kosmetika: Krem","dona"),("Krem qo'l","Kosmetika: Krem","dona"),
    ("Pomada lab","Kosmetika: Makiyaj","dona"),("Tush ko'z","Kosmetika: Makiyaj","dona"),
    ("Pudra","Kosmetika: Makiyaj","dona"),("Lak tirnoq","Kosmetika: Makiyaj","dona"),
    ("Atir erkak","Kosmetika: Atir","dona"),("Atir ayol","Kosmetika: Atir","dona"),
    ("Dezodorant erkak","Kosmetika: Gigiyena","dona"),("Dezodorant ayol","Kosmetika: Gigiyena","dona"),
]
_XOZMAG = [
    ("Daftar 48 varaq","Kanselyariya","dona"),("Daftar 96 varaq","Kanselyariya","dona"),
    ("Ruchka ko'k","Kanselyariya","dona"),("Karandash","Kanselyariya","dona"),
    ("Lastik","Kanselyariya","dona"),("Kley PVA","Kanselyariya","dona"),
    ("Skotch","Kanselyariya","dona"),("Qaychi","Kanselyariya","dona"),
    ("Papka A4","Kanselyariya","dona"),("Qog'oz A4 500","Kanselyariya","dona"),
]

SEGMENT_KATALOG: dict[str, list[tuple[str, str, str]]] = {
    "optom":     _KIMYOVIY + _GIGIYENA + _OZIQ_OVQAT + _ICHIMLIK + _SHIRINLIK + _KOSMETIKA,
    "chakana":   _KIMYOVIY + _GIGIYENA + _OZIQ_OVQAT + _ICHIMLIK + _SHIRINLIK,
    "oshxona":   _OSHXONA,
    "xozmak":    _ICHIMLIK + _SHIRINLIK + _GIGIYENA[:12] + _XOZMAG,
    "kiyim":     _KIYIM + _KOSMETIKA[:6],
    "gosht":     _GOSHT,
    "meva":      _MEVA_SABZAVOT,
    "qurilish":  _QURILISH,
    "avto":      _AVTO,
    "dorixona":  _DORIXONA,
    "texnika":   _TEXNIKA,
    "mebel":     _MEBEL,
    "mato":      _MATO + _KIYIM[:10],
    "gul":       _GUL,
    "kosmetika": _KOSMETIKA + _GIGIYENA,
    "universal": _KIMYOVIY[:10] + _GIGIYENA[:8] + _OZIQ_OVQAT[:10] + _ICHIMLIK[:8] + _SHIRINLIK[:6],
}

async def seed_tovarlar(conn, uid: int, segment: str) -> int:
    mavjud = await conn.fetchval("SELECT COUNT(*) FROM tovarlar WHERE user_id = $1", uid)
    if mavjud and mavjud > 0:
        log.info("seed: uid=%d da %d ta tovar bor", uid, mavjud)
        return 0
    katalog = SEGMENT_KATALOG.get(segment, SEGMENT_KATALOG["universal"])
    yuklandi = 0
    for nomi, kategoriya, birlik in katalog:
        try:
            await conn.execute("""
                INSERT INTO tovarlar (user_id, nomi, kategoriya, birlik, qoldiq, min_qoldiq)
                VALUES ($1, $2, $3, $4, 0, 0)
                ON CONFLICT (user_id, lower(nomi)) DO NOTHING
            """, uid, nomi, kategoriya, birlik)
            yuklandi += 1
        except Exception as e:
            log.debug("seed '%s': %s", nomi, e)
    log.info("seed: uid=%d segment=%s -> %d ta tovar", uid, segment, yuklandi)
    return yuklandi
