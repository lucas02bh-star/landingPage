# Camisa social azul royal com ADONAY bordado no peito
from comum import *

foto = Image.open(os.path.join(BASE, 'px-3737408.jpg')).convert('RGB')
mask = cv2.imread(os.path.join(BASE, '_mask-social.png'), 0)
# apaga o logo bordado original da camisa antes de recolorir
bgr0 = cv2.cvtColor(np.asarray(foto), cv2.COLOR_RGB2BGR)
logo = np.zeros(mask.shape, np.uint8)
cv2.circle(logo, (583, 466), 22, 255, -1)
foto = Image.fromarray(cv2.cvtColor(cv2.inpaint(bgr0, logo, 9, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB))

# Vermelho -> azul royal pelo tom (mantém tramas, costuras e sombras)
bgr = cv2.cvtColor(np.asarray(foto), cv2.COLOR_RGB2BGR)
hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
h = hsv[..., 0]
dist_vermelho = np.minimum(h, 180 - h)
perto = cv2.dilate(mask, np.ones((15, 15), np.uint8)) > 0
peso = perto * np.clip(1 - dist_vermelho / 16, 0, 1) * np.clip((hsv[..., 1] - 40) / 50, 0, 1)
peso = cv2.GaussianBlur(peso.astype(np.float32), (3, 3), 0)
novo = hsv.copy()
novo[..., 0] = 109                      # azul royal
novo[..., 1] = np.clip(hsv[..., 1] * 1.3 + 25, 0, 255)
novo[..., 2] = np.clip(hsv[..., 2] * 1.12, 0, 255)
# mistura em RGB (misturar o tom em HSV gera verde nas bordas)
orig_rgb = np.asarray(foto).astype(np.float32)
novo_rgb = cv2.cvtColor(cv2.cvtColor(novo.astype(np.uint8), cv2.COLOR_HSV2BGR), cv2.COLOR_BGR2RGB).astype(np.float32)
mix = orig_rgb * (1 - peso[..., None]) + novo_rgb * peso[..., None]
camisa = Image.fromarray(np.clip(mix, 0, 255).astype(np.uint8))
sombra = hsv[..., 2] / np.median(hsv[..., 2][mask > 0])

# ---------- bordado ----------
K = 4
W, H = 300 * K, 90 * K
m = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(m)
f = fonte('Oswald.ttf', 64 * K, 700)
d.text((6 * K, 0), 'ADONAY', font=f, fill=255)
larg = d.textlength('ADONAY', font=f)
# marca ✳ da ADONAY (desenhada com traços, em linha dourada)
mk = Image.new('L', (W, H), 0)
dm = ImageDraw.Draw(mk)
cx, cy, r = 6 * K + larg + 16 * K, 22 * K, 10 * K
for ang in range(0, 180, 45):
    a = np.deg2rad(ang)
    dm.line((cx - r * np.cos(a), cy - r * np.sin(a), cx + r * np.cos(a), cy + r * np.sin(a)), fill=255, width=4 * K)


def linha_bordada(mascara, cor, angulo):
    a = np.asarray(mascara).astype(np.float32) / 255
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    t = np.deg2rad(angulo)
    ponto = .88 + .12 * np.sin((xx * np.cos(t) + yy * np.sin(t)) / (1.0 * K) * np.pi)   # fios do ponto cetim
    dist = cv2.distanceTransform((a > .5).astype(np.uint8), cv2.DIST_L2, 5)
    relevo = np.clip(dist / (5 * K), 0, 1) ** .6 * .4 + .6                             # borda mais escura = relevo
    ruido = np.random.default_rng(3).normal(1, .04, a.shape)
    rgb = np.clip(np.array(cor, np.float32)[None, None, :] * (ponto * relevo * ruido)[..., None], 0, 255)
    return Image.merge('RGBA', (*Image.fromarray(rgb.astype(np.uint8)).split(), mascara))


letras = linha_bordada(m, (250, 250, 246), 62)
marca = linha_bordada(mk, (222, 196, 140), 20)
bordado = Image.alpha_composite(letras, marca)
bordado = bordado.crop(bordado.getbbox())
LARG = 168
bordado = bordado.resize((LARG, int(bordado.height * LARG / bordado.width)), Image.LANCZOS)

# sombra do bordado sobre o tecido
pos = (590 - LARG // 2, 440)
sombra_b = Image.new('RGBA', camisa.size, (0, 0, 0, 0))
alfa = bordado.split()[3].filter(ImageFilter.GaussianBlur(2))
sombra_b.paste((0, 0, 30, 150), (pos[0] + 1, pos[1] + 2), alfa)
base = Image.alpha_composite(camisa.convert('RGBA'), sombra_b).convert('RGB')
final = aplicar_estampa(base, bordado, pos, sombra, np.ones_like(mask), opacidade=1, tinta=.3)

# fundo branco do estúdio vira o escuro do site (com borda suave)
hsv0 = cv2.cvtColor(bgr0, cv2.COLOR_BGR2HSV)
fundo = ((hsv0[..., 2] > 228) & (hsv0[..., 1] < 28)).astype(np.uint8)
n, rot, est, _ = cv2.connectedComponentsWithStats(fundo)
fundo = np.isin(rot, [k for k in range(1, n) if est[k, 4] > 2000]).astype(np.float32)
fundo = cv2.GaussianBlur(cv2.dilate(fundo, np.ones((3, 3), np.uint8)), (7, 7), 0)[..., None]
hh, ww = fundo.shape[:2]
yy, xx = np.mgrid[0:hh, 0:ww]
vinheta = 1 - np.clip(np.hypot((xx - ww / 2) / ww, (yy - hh * .45) / hh) * 1.4, 0, 1)
escuro = (np.array([12, 12, 12], np.float32) + np.array([22, 20, 17], np.float32) * vinheta[..., None])
final = Image.fromarray((np.asarray(final).astype(np.float32) * (1 - fundo) + escuro * fundo).astype(np.uint8))

salvar(recorte_4x5(final, 426, 640, 853), 'empresa-a')
salvar(recorte_4x5(final, 560, 470, 330), 'empresa-b')
final.save(os.path.join(BASE, '_empresa-full.jpg'), quality=90)
print('ok')
