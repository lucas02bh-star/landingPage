# Camisa de interclasse sublimada, malha dry fit, gola redonda (mesma base do site)
# Padrão de mercado: arte em faixas diagonais, escudo no peito, nome + número grande nas costas.
from comum import *
from malha import frente, costas, sombreamento

W, H = 1400, 1000
BRANCO = (246, 243, 236)
rng = np.random.default_rng(11)


def arte_sublimada(espelhar=False):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = np.clip((yy - 60) / 900, 0, 1)[..., None]
    topo, baixo = np.array([168, 20, 42], np.float32), np.array([46, 6, 14], np.float32)
    img = topo * (1 - t) + baixo * t
    # faixas diagonais (tons de vinho) e filetes dourados
    d = (xx - yy * .55) if not espelhar else ((W - xx) - yy * .55)
    faixa = (np.sin(d / 46) > .55).astype(np.float32)
    img = img * (1 - .22 * faixa[..., None])
    for c0 in (480, 560, 1010):
        fil = np.clip(1 - np.abs(d - c0) / 2.2, 0, 1)[..., None]
        img = img * (1 - fil) + np.array([214, 178, 104], np.float32) * fil
    # pontilhado meio-tom subindo da barra
    meio = np.clip((yy - 640) / 360, 0, 1)
    pont = ((np.sin(xx / 3.2) * np.sin(yy / 3.2)) > (1 - meio * 1.6)).astype(np.float32)
    img = img * (1 - .25 * pont[..., None])
    return img


def textura_dry_fit(img):
    """Malha dry fit: furinhos em colmeia + trama fina."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    desloc = (np.floor(yy / 5) % 2) * 2.5
    furo = (((xx + desloc) % 5 - 2.5) ** 2 + (yy % 5 - 2.5) ** 2) < 1.6
    trama = .97 + .03 * np.sin((xx + yy) * 1.7)
    return img * (1 - .16 * furo[..., None]) * trama[..., None]


def vestir(base, arte):
    s, alfa = sombreamento(base)
    luz = np.clip(s, .22, 2.2) ** .85
    out = np.clip(textura_dry_fit(arte) * luz[..., None], 0, 255).astype(np.uint8)
    img = Image.fromarray(out).convert('RGBA')
    img.putalpha(base.split()[3])
    return img, s, alfa


def texto_centro(d, cx, y, s, f, cor, espaco=0):
    larg = sum(d.textlength(ch, font=f) for ch in s) + espaco * (len(s) - 1)
    x = cx - larg / 2
    for ch in s:
        d.text((x, y), ch, font=f, fill=cor)
        x += d.textlength(ch, font=f) + espaco


def colar(img, arte, cx, y, larg, s, alfa):
    a = arte.resize((larg, int(arte.height * larg / arte.width)), Image.LANCZOS)
    rgb = aplicar_estampa(img.convert('RGB'), a, (int(cx - larg / 2), y), s, alfa, opacidade=.98, tinta=.35)
    out = rgb.convert('RGBA')
    out.putalpha(img.split()[3])
    return out


K = 3
# ---------- costas: nome + número ----------
tras_base = costas()
tras, s, alfa = vestir(tras_base, arte_sublimada(espelhar=True))
nome = Image.new('L', (400 * K, 70 * K), 0)
texto_centro(ImageDraw.Draw(nome), 200 * K, 0, 'LUCAS', fonte('Oswald.ttf', 56 * K, 700), 255, espaco=8 * K)
nome = Image.merge('RGBA', (*Image.new('RGB', nome.size, BRANCO).split(), nome)).crop((0, 0, 400 * K, 70 * K))
nome = nome.crop(nome.getbbox())
num_m = Image.new('L', (400 * K, 330 * K), 0)
texto_centro(ImageDraw.Draw(num_m), 200 * K, 0, '10', fonte('Anton.ttf', 290 * K), 255, espaco=6 * K)
contorno = Image.fromarray(cv2.dilate(np.asarray(num_m), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (10 * K, 10 * K))))
numero = Image.alpha_composite(
    Image.merge('RGBA', (*gradiente_dourado(*contorno.size).split(), contorno)),
    Image.merge('RGBA', (*Image.new('RGB', num_m.size, BRANCO).split(), num_m)))
numero = numero.crop(numero.getbbox())
turma = Image.new('L', (400 * K, 50 * K), 0)
texto_centro(ImageDraw.Draw(turma), 200 * K, 0, '3º ANO B', fonte('Oswald.ttf', 34 * K, 600), 255, espaco=8 * K)
turma = Image.merge('RGBA', (*gradiente_dourado(*turma.size).split(), turma))
turma = turma.crop(turma.getbbox())
tras = colar(tras, nome, 712, 200, 170, s, alfa)
tras = colar(tras, numero, 712, 270, 230, s, alfa)
tras = colar(tras, turma, 712, 600, 130, s, alfa)

# ---------- frente: escudo no peito + "INTERCLASSE 2026" ----------
fr_base = frente()
fr, s2, alfa2 = vestir(fr_base, arte_sublimada())
E = 220 * K
esc = Image.new('L', (E, int(E * 1.18)), 0)
de = ImageDraw.Draw(esc)
w, h = esc.size
escudo = [(w * .08, h * .06), (w * .92, h * .06), (w * .92, h * .55), (w * .5, h * .95), (w * .08, h * .55)]
de.polygon(escudo, fill=255)
interno = Image.new('L', esc.size, 0)
di = ImageDraw.Draw(interno)
di.polygon([(w * .16, h * .12), (w * .84, h * .12), (w * .84, h * .52), (w * .5, h * .86), (w * .16, h * .52)], fill=255)
esc = ImageChops.subtract(esc, interno)
de = ImageDraw.Draw(esc)
texto_centro(de, w / 2, h * .2, '3ºB', fonte('Anton.ttf', 70 * K), 255)
for i in range(3):
    x = w / 2 + (i - 1) * 26 * K
    de.regular_polygon((x, h * .66, 8 * K), 5, rotation=-90, fill=255)
escudo_img = Image.merge('RGBA', (*gradiente_dourado(*esc.size).split(), esc))
fr = colar(fr, escudo_img, 808, 215, 82, s2, alfa2)
txt = Image.new('L', (520 * K, 50 * K), 0)
texto_centro(ImageDraw.Draw(txt), 260 * K, 0, 'INTERCLASSE 2026', fonte('Oswald.ttf', 36 * K, 700), 255, espaco=8 * K)
txt = Image.merge('RGBA', (*Image.new('RGB', txt.size, BRANCO).split(), txt))
txt = txt.crop(txt.getbbox())
fr = colar(fr, txt, 712, 360, 220, s2, alfa2)

salvar(recorte_4x5(tras, 700, 500, 860), 'interclasse-a')
salvar(recorte_4x5(fr, 700, 500, 860), 'interclasse-b')
print('ok')
