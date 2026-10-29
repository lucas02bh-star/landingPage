# Baby look verde musgo com estampa dourada de ministério
from comum import *

foto = Image.open(os.path.join(BASE, 'px-7979848.jpg')).convert('RGB')
mask = cv2.imread(os.path.join(BASE, '_mask-baby.png'), 0)
# descarta pedaços soltos do fundo (janela à esquerda)
n, rot, est, cen = cv2.connectedComponentsWithStats(mask)
for k in range(1, n):
    if cen[k][0] < 150:
        mask[rot == k] = 0
# Troca pelo tom (HSV): pega também as mechas de cabelo semitransparentes sobre a camisa
bgr = cv2.cvtColor(np.asarray(foto), cv2.COLOR_RGB2BGR)
hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
perto = cv2.dilate(mask, np.ones((41, 41), np.uint8)) > 0
peso = perto * np.clip(1 - np.abs(hsv[..., 0] - 84) / 32, 0, 1) * np.clip((hsv[..., 1] - 4) / 30, 0, 1)
peso = cv2.GaussianBlur(peso.astype(np.float32), (5, 5), 0)
novo = hsv.copy()
novo[..., 0] = 38                       # verde musgo (oliva)
novo[..., 1] = hsv[..., 1] * .62
novo[..., 2] = hsv[..., 2] * .6
mix = hsv * (1 - peso[..., None]) + novo * peso[..., None]
camisa = Image.fromarray(cv2.cvtColor(cv2.cvtColor(mix.astype(np.uint8), cv2.COLOR_HSV2BGR), cv2.COLOR_BGR2RGB))
sombra = hsv[..., 2] / np.median(hsv[..., 2][mask > 0])

# ---------- estampa (desenhada 4x maior e reduzida no fim) ----------
K = 4
W, H = 420 * K, 300 * K
texto = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(texto)
cx = W // 2


def centro(y, s, f, espaco=0):
    larg = sum(d.textlength(ch, font=f) for ch in s) + espaco * (len(s) - 1)
    x = cx - larg / 2
    for ch in s:
        d.text((x, y), ch, font=f, fill=255)
        x += d.textlength(ch, font=f) + espaco


# cruz com traços dos lados
cy = 28 * K
d.rectangle((cx - 2 * K, cy - 16 * K, cx + 2 * K, cy + 22 * K), fill=255)
d.rectangle((cx - 11 * K, cy - 6 * K, cx + 11 * K, cy - 2 * K), fill=255)
d.rectangle((cx - 90 * K, cy + 2 * K, cx - 22 * K, cy + 4 * K), fill=255)
d.rectangle((cx + 22 * K, cy + 2 * K, cx + 90 * K, cy + 4 * K), fill=255)
centro(60 * K, 'MINISTÉRIO DE', fonte('Cinzel.ttf', 27 * K, 900), espaco=4 * K)
centro(86 * K, 'LOUVOR', fonte('Cinzel.ttf', 74 * K, 900), espaco=1 * K)
d.rectangle((cx - 60 * K, 186 * K, cx + 60 * K, 188 * K), fill=255)
centro(198 * K, 'SALMOS 150:6', fonte('Cinzel.ttf', 24 * K, 900), espaco=4 * K)

ouro = gradiente_dourado(W, H)
estampa = Image.merge('RGBA', (*ouro.split(), texto))
estampa = estampa.crop(estampa.getbbox())
estampa = granulado(estampa, .1)
LARG = 205
estampa = estampa.resize((LARG, int(estampa.height * LARG / estampa.width)), Image.LANCZOS)

pos = (433 - LARG // 2, 610)
final = aplicar_estampa(camisa, estampa, pos, sombra, (peso > .45).astype(np.uint8), opacidade=.97, tinta=.7)

salvar(recorte_4x5(final, 426, 700, 853), 'igreja-a')
salvar(recorte_4x5(final, 432, 705, 400), 'igreja-b')
final.save(os.path.join(BASE, '_igreja-full.jpg'), quality=90)
print('ok')
