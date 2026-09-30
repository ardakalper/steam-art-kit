// English and Turkish. A unit test enforces that both have exactly the same keys.
export const STRINGS = {
  en: {
    'app.title': 'Steam Art Kit', 'app.tagline': 'Every store and library image from one artwork. Nothing leaves your browser.',
    'src.title': 'Artwork', 'src.drop': 'Drop your key art here, or', 'src.pick': 'choose a file', 'src.hint': 'PNG, JPG or WebP. Biggest you have: 4K or larger crops best.',
    'src.focus': 'Click the image to set the focus point. Every crop is centred on it.', 'src.replace': 'Replace', 'src.info': '{w} × {h} px',
    'logo.title': 'Logo (optional)', 'logo.drop': 'Drop a transparent PNG logo, or', 'logo.hint': 'Used for the logo assets and can be laid over the capsules.',
    'logo.overlay': 'Lay the logo over capsules and headers', 'logo.position': 'Position', 'logo.size': 'Size', 'logo.margin': 'Margin',
    'opt.title': 'Output', 'opt.game': 'Game name', 'opt.game.ph': 'used in file names', 'opt.format': 'Default format', 'opt.quality': 'JPG quality', 'opt.bg': 'JPG background',
    'opt.actual': 'Preview at the size Steam shows it', 'opt.legacy': 'Also make the pre-2024 sizes (press kits, older tools)',
    'group.store': 'Store page', 'group.library': 'Library', 'group.custom': 'Custom library art', 'group.community': 'Community and client',
    'group.store.note': 'Capsules must carry a legible title and may not include review quotes, award logos or discount text.',
    'group.custom.note': 'For your own library: Steam client → right-click a game → Manage → Set custom artwork. Same sizes SteamGridDB uses.',
    'asset.header': 'Header capsule', 'asset.small': 'Small capsule', 'asset.main': 'Main capsule', 'asset.vertical': 'Vertical capsule',
    'asset.background': 'Page background', 'asset.screenshot': 'Screenshot', 'asset.event': 'Event cover',
    'asset.libcapsule': 'Library capsule', 'asset.libheader': 'Library header', 'asset.libhero': 'Library hero', 'asset.liblogo': 'Library logo',
    'asset.grid': 'Grid (portrait)', 'asset.gridwide': 'Grid (wide)', 'asset.hero': 'Hero', 'asset.logo': 'Logo', 'asset.icon': 'Icon',
    'asset.communityicon': 'Community icon', 'asset.clienticon': 'Client icon',
    'hint.header': 'Top of the store page, search results, recommendations.', 'hint.small': 'Search lists, wishlists, tiny: keep the title huge.',
    'hint.main': 'Front page featured slots and sale pages.', 'hint.vertical': 'Seasonal sale grids and tag pages.', 'hint.background': 'Behind the store page, mostly covered: keep it subtle.',
    'hint.screenshot': '16:9 gameplay, no marketing text; at least five on a page.', 'hint.event': 'Store event and announcement covers.',
    'hint.libcapsule': 'The poster in the library grid. Logo and subtitle only.', 'hint.libheader': 'Recent games strip and the small library view.', 'hint.libhero': 'The banner at the top of the game page. The dashed centre stays visible at every window size.',
    'hint.liblogo': 'Transparent PNG placed over the hero.', 'hint.grid': 'Custom poster for any game in your library.', 'hint.gridwide': 'Custom wide grid and the recent games strip.',
    'hint.hero': 'Custom banner for the game page.', 'hint.logo': 'Custom transparent logo over the hero.', 'hint.icon': 'Custom icon for the list view.',
    'hint.communityicon': 'Library list view, chat, notifications and the mobile app.', 'hint.clienticon': 'Desktop shortcut icon.',
    'card.zoom': 'Zoom', 'card.reset': 'Reset', 'card.download': 'Download', 'card.include': 'Include in ZIP', 'card.drag': 'drag to reposition',
    'card.upscaled': 'Upscaled ×{f}: your artwork is smaller than this target.', 'card.legacy': 'Legacy size {w} × {h}', 'card.safe': 'dashed: always visible area',
    'card.needlogo': 'Add a logo to make this one.',
    'export.zip': 'Download ZIP', 'export.count': '{n} files, {size}', 'export.none': 'Add an artwork to begin.', 'export.working': 'Rendering…',
    'msg.badfile': 'That file could not be read as an image.', 'msg.done': 'Done: {n} files.', 'msg.toolarge': 'Image larger than {max} px on a side; it will still work but slowly.',
    'settings.lang': 'Language', 'settings.theme': 'Theme', 'theme.dark': 'Dark', 'theme.light': 'Light', 'btn.install': 'Install',
    'foot.text': 'Independent tool, not affiliated with Valve. Sizes follow the Steamworks documentation as of 2025; check the docs before a launch.',
    'foot.source': 'Source on GitHub',
    'asset.eventheader': 'Event header', 'asset.bundle': 'Bundle header',
    'hint.eventheader': 'Optional banner at the top of an event page.', 'hint.bundle': 'Top of a bundle page; lead with the branding.',
    'opt.appid': 'Steam app ID', 'opt.appid.ph': 'e.g. 620', 'opt.appid.hint': 'Names custom art the way the client\'s grid folder expects: 620p.png, 620_hero.png…',
    'logo.heropos': 'Logo over the hero (preview)', 'hp.BottomLeft': 'Bottom left', 'hp.UpperCenter': 'Top centre', 'hp.CenterCenter': 'Centre', 'hp.BottomCenter': 'Bottom centre',
    'card.heropreview': 'The logo is shown where the client pins it; it is not baked into the file.', 'card.notext': 'Artwork only: no words on this one.',
    'card.fitlogo': 'Your logo, trimmed to fit {w} × {h} with a transparent background.', 'card.ico': 'ICO with {sizes} px inside.',
    'pos.tl': 'Top left', 'pos.t': 'Top', 'pos.tr': 'Top right', 'pos.l': 'Left', 'pos.c': 'Centre', 'pos.r': 'Right', 'pos.bl': 'Bottom left', 'pos.b': 'Bottom', 'pos.br': 'Bottom right',
  },
  tr: {
    'app.title': 'Steam Art Kit', 'app.tagline': 'Tek bir görselden tüm mağaza ve kütüphane görselleri. Hiçbir şey tarayıcından çıkmaz.',
    'src.title': 'Görsel', 'src.drop': 'Ana görselini buraya bırak ya da', 'src.pick': 'dosya seç', 'src.hint': 'PNG, JPG veya WebP. Elindeki en büyüğü: 4K ve üstü en iyi sonucu verir.',
    'src.focus': 'Odak noktasını görsele tıklayarak seç. Her kırpma onun etrafında ortalanır.', 'src.replace': 'Değiştir', 'src.info': '{w} × {h} px',
    'logo.title': 'Logo (isteğe bağlı)', 'logo.drop': 'Şeffaf PNG logoyu buraya bırak ya da', 'logo.hint': 'Logo çıktılarında kullanılır, kapsüllerin üstüne de bindirilebilir.',
    'logo.overlay': 'Logoyu kapsül ve header görsellerine bindir', 'logo.position': 'Konum', 'logo.size': 'Boyut', 'logo.margin': 'Kenar boşluğu',
    'opt.title': 'Çıktı', 'opt.game': 'Oyun adı', 'opt.game.ph': 'dosya adlarında kullanılır', 'opt.format': 'Varsayılan biçim', 'opt.quality': 'JPG kalitesi', 'opt.bg': 'JPG arka planı',
    'opt.actual': 'Steam\'in gösterdiği boyutta önizle', 'opt.legacy': '2024 öncesi boyutları da üret (basın kiti, eski araçlar)',
    'group.store': 'Mağaza sayfası', 'group.library': 'Kütüphane', 'group.custom': 'Özel kütüphane görselleri', 'group.community': 'Topluluk ve istemci',
    'group.store.note': 'Kapsüllerde okunaklı bir başlık olmalı; inceleme alıntısı, ödül logosu ve indirim yazısı yasak.',
    'group.custom.note': 'Kendi kütüphanen için: Steam istemcisi → oyuna sağ tık → Yönet → Özel görsel ayarla. SteamGridDB ile aynı boyutlar.',
    'asset.header': 'Header kapsülü', 'asset.small': 'Küçük kapsül', 'asset.main': 'Ana kapsül', 'asset.vertical': 'Dikey kapsül',
    'asset.background': 'Sayfa arka planı', 'asset.screenshot': 'Ekran görüntüsü', 'asset.event': 'Etkinlik kapağı',
    'asset.libcapsule': 'Kütüphane kapsülü', 'asset.libheader': 'Kütüphane header', 'asset.libhero': 'Kütüphane hero', 'asset.liblogo': 'Kütüphane logosu',
    'asset.grid': 'Grid (dikey)', 'asset.gridwide': 'Grid (geniş)', 'asset.hero': 'Hero', 'asset.logo': 'Logo', 'asset.icon': 'Simge',
    'asset.communityicon': 'Topluluk simgesi', 'asset.clienticon': 'İstemci simgesi',
    'hint.header': 'Mağaza sayfasının üstü, arama sonuçları, öneriler.', 'hint.small': 'Arama listeleri, istek listeleri, çok küçük: başlık kocaman olsun.',
    'hint.main': 'Ana sayfa vitrini ve indirim sayfaları.', 'hint.vertical': 'Sezon indirimi ızgaraları ve etiket sayfaları.', 'hint.background': 'Mağaza sayfasının arkasında, çoğu kapalı: sade tut.',
    'hint.screenshot': '16:9 oynanış, pazarlama yazısı yok; sayfada en az beş tane.', 'hint.event': 'Mağaza etkinlik ve duyuru kapakları.',
    'hint.libcapsule': 'Kütüphane ızgarasındaki poster. Sadece logo ve alt başlık.', 'hint.libheader': 'Son oynananlar şeridi ve küçük kütüphane görünümü.', 'hint.libhero': 'Oyun sayfasının üstündeki afiş. Kesikli ortadaki alan her pencere boyutunda görünür kalır.',
    'hint.liblogo': 'Hero üstüne konan şeffaf PNG.', 'hint.grid': 'Kütüphanendeki herhangi bir oyun için özel poster.', 'hint.gridwide': 'Özel geniş grid ve son oynananlar şeridi.',
    'hint.hero': 'Oyun sayfası için özel afiş.', 'hint.logo': 'Hero üstüne özel şeffaf logo.', 'hint.icon': 'Liste görünümü için özel simge.',
    'hint.communityicon': 'Kütüphane liste görünümü, sohbet, bildirimler ve mobil uygulama.', 'hint.clienticon': 'Masaüstü kısayol simgesi.',
    'card.zoom': 'Yakınlaştır', 'card.reset': 'Sıfırla', 'card.download': 'İndir', 'card.include': 'ZIP\'e ekle', 'card.drag': 'sürükleyerek konumlandır',
    'card.upscaled': '×{f} büyütüldü: görselin bu hedeften küçük.', 'card.legacy': 'Eski boyut {w} × {h}', 'card.safe': 'kesikli: her zaman görünen alan',
    'card.needlogo': 'Bunu üretmek için bir logo ekle.',
    'export.zip': 'ZIP indir', 'export.count': '{n} dosya, {size}', 'export.none': 'Başlamak için bir görsel ekle.', 'export.working': 'İşleniyor…',
    'msg.badfile': 'Bu dosya görsel olarak okunamadı.', 'msg.done': 'Bitti: {n} dosya.', 'msg.toolarge': 'Görselin bir kenarı {max} px\'den büyük; çalışır ama yavaş olur.',
    'settings.lang': 'Dil', 'settings.theme': 'Tema', 'theme.dark': 'Koyu', 'theme.light': 'Açık', 'btn.install': 'Kur',
    'foot.text': 'Bağımsız bir araç, Valve ile ilgisi yok. Boyutlar 2025 itibarıyla Steamworks belgelerini izler; lansmandan önce belgeleri kontrol et.',
    'foot.source': 'GitHub\'da kaynak',
    'asset.eventheader': 'Etkinlik header', 'asset.bundle': 'Paket header',
    'hint.eventheader': 'Etkinlik sayfasının üstündeki isteğe bağlı afiş.', 'hint.bundle': 'Paket sayfasının üstü; markayı öne çıkar.',
    'opt.appid': 'Steam uygulama ID', 'opt.appid.ph': 'örn. 620', 'opt.appid.hint': 'Özel görselleri istemcinin grid klasörünün beklediği gibi adlandırır: 620p.png, 620_hero.png…',
    'logo.heropos': 'Hero üstünde logo (önizleme)', 'hp.BottomLeft': 'Sol alt', 'hp.UpperCenter': 'Üst orta', 'hp.CenterCenter': 'Orta', 'hp.BottomCenter': 'Alt orta',
    'card.heropreview': 'Logo, istemcinin koyduğu yerde gösterilir; dosyaya işlenmez.', 'card.notext': 'Sadece görsel: bunda yazı olmaz.',
    'card.fitlogo': 'Logon, şeffaf arka planla {w} × {h} içine sığacak şekilde kırpılır.', 'card.ico': 'İçinde {sizes} px olan ICO.',
    'pos.tl': 'Sol üst', 'pos.t': 'Üst', 'pos.tr': 'Sağ üst', 'pos.l': 'Sol', 'pos.c': 'Orta', 'pos.r': 'Sağ', 'pos.bl': 'Sol alt', 'pos.b': 'Alt', 'pos.br': 'Sağ alt',
  },
};

let lang = 'en';
export function setLang(l) { lang = STRINGS[l] ? l : 'en'; document.documentElement.lang = lang; }
export function getLang() { return lang; }
export function t(key, vars) {
  let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
export function applyI18n(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of root.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
}
export function detectLang() { return (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en'; }
