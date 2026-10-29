# Funções comuns para montar os mockups dos cards de segmento.
# Fotos-base: referencias-imagens/mockups-base (Unsplash/Pixabay, licença livre).
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BASE = os.path.join(RAIZ, 'referencias-imagens', 'mockups-base')
FONTES = os.path.join(os.path.dirname(__file__), 'fonts')
SAIDA = os.path.join(RAIZ, 'site', 'img', 'segmentos')
os.makedirs(SAIDA, exist_ok=True)


def fonte(nome, tamanho, peso=None):
    f = ImageFont.truetype(os.path.join(FONTES, nome), tamanho)
    if peso is not None:
        try:
            f.set_variation_by_axes([peso] + ([14] if 'DMSans' in nome else []))
        except Exception:
            pass
    return f


def recolorir(img_rgb, mask, cor, contraste=1.0, brilho=1.0):
    """Troca a cor da peça mantendo dobras e sombras (luminância vira sombreamento)."""
    a = np.asarray(img_rgb).astype(np.float32) / 255
    lum = (a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114)
    m = mask > 0
    ref = np.median(lum[m])
    s = (lum / max(ref, 1e-3)) ** contraste * brilho
    nova = np.clip(np.array(cor, np.float32)[None, None, :] / 255 * s[..., None], 0, 1)
    # realce suave onde o tecido brilha
    realce = np.clip((s - 1.15) * .5, 0, .35)[..., None]
    nova = np.clip(nova + realce, 0, 1)
    alpha = cv2.GaussianBlur((mask > 0).astype(np.float32), (5, 5), 0)[..., None]
    out = a * (1 - alpha) + nova * alpha
    return Image.fromarray((out * 255).astype(np.uint8)), s


def gradiente_dourado(w, h):
    """Dourado metálico: faixas claras e escuras na vertical."""
    y = np.linspace(0, 1, h)[:, None]
    stops = [(0, (247, 231, 186)), (.35, (201, 165, 92)), (.55, (240, 220, 160)), (.8, (167, 128, 60)), (1, (226, 199, 135))]
    out = np.zeros((h, w, 3), np.float32)
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        t = np.clip((y - p0) / (p1 - p0), 0, 1)
        sel = (y >= p0) & (y <= p1)
        cor = np.array(c0) * (1 - t) + np.array(c1) * t
        out = np.where(sel[..., None], np.broadcast_to(cor[..., None, :], (h, 1, 3)) * np.ones((1, w, 1)), out)
    return Image.fromarray(out.astype(np.uint8))


def aplicar_estampa(base_rgb, estampa_rgba, pos, sombreamento, mask, opacidade=.96, tinta=.85):
    """Cola a estampa acompanhando as dobras do tecido (multiplica pelo sombreamento)."""
    base = base_rgb.convert('RGBA')
    camada = Image.new('RGBA', base.size, (0, 0, 0, 0))
    camada.paste(estampa_rgba, pos, estampa_rgba)
    c = np.asarray(camada).astype(np.float32) / 255
    s = np.clip(sombreamento, .45, 1.5)[..., None]
    rgb = np.clip(c[..., :3] * (s * tinta + (1 - tinta)), 0, 1)
    al = c[..., 3:4] * opacidade * (np.asarray(mask)[..., None] > 0)
    b = np.asarray(base).astype(np.float32) / 255
    out = b[..., :3] * (1 - al) + rgb * al
    return Image.fromarray((out * 255).astype(np.uint8))


def granulado(img_rgba, forca=.12, seed=1):
    """Textura de tinta de serigrafia: tira um pouco de opacidade aleatória."""
    rng = np.random.default_rng(seed)
    a = np.asarray(img_rgba).astype(np.float32)
    ruido = rng.normal(1, forca, a.shape[:2])
    a[..., 3] = np.clip(a[..., 3] * ruido, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def recorte_4x5(img, cx, cy, largura):
    w = largura
    h = int(w * 1.25)
    return img.crop((int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2)))


def salvar(img, nome, tamanho=(640, 800)):
    img = img.resize(tamanho, Image.LANCZOS)
    caminho = os.path.join(SAIDA, nome + '.webp')
    img.save(caminho, 'WEBP', quality=84, method=6)
    return caminho
