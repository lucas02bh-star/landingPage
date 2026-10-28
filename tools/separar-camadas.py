"""Separa a estampa frontal em camadas para a seção Exploded View.

A partir da vista frontal alinhada (tee-00-lg.webp) gera:
  layer-malha     camiseta lisa (estampa removida por inpainting)
  layer-tracado   traçado de Interlagos
  layer-logo      logo SENNA
  layer-bandeira  bandeira em chamas da manga
  layer-costas    arte das costas (reduzida, para a camada de baixo)

Todas no mesmo quadro (1400 x 1000), então se encaixam perfeitamente.
Provisório: quando houver a foto da camiseta lisa, troque layer-malha.

Uso:  python tools/separar-camadas.py   (rode antes o preparar-imagens.py)
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TEE = ROOT / "site" / "img" / "tee" / "tee-00-lg.webp"
BACK_ART = ROOT / "prototipo" / "dist" / "senna-back.png"
OUT = ROOT / "site" / "img" / "layers"

# Regiões (x0, y0, x1, y1) no quadro de 1400 x 1000
LOGO_BOX = (560, 285, 1000, 400)
TRACK_BOX = (600, 200, 940, 490)
FLAG_BOX = (270, 180, 500, 440)


def region(shape, box):
    mask = np.zeros(shape, bool)
    x0, y0, x1, y1 = box
    mask[y0:y1, x0:x1] = True
    return mask


def save(name, rgba):
    img = Image.fromarray(rgba, "RGBA")
    img.save(OUT / f"{name}-lg.webp", "WEBP", quality=86, method=6)
    img.resize((760, 543), Image.LANCZOS).save(OUT / f"{name}-sm.webp", "WEBP", quality=86, method=6)
    print(name, (OUT / f"{name}-lg.webp").stat().st_size // 1024, "KB")


def layer(rgb, alpha):
    rgba = np.dstack([rgb, np.clip(alpha, 0, 255).astype(np.uint8)])
    rgba[rgba[..., 3] == 0, :3] = 0
    return rgba


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = np.array(Image.open(TEE).convert("RGBA"))
    rgb, a = src[..., :3].copy(), src[..., 3]
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    inside = a > 200

    # Logo: tons claros dentro da área do peito (borda suave preservada)
    logo_alpha = np.clip((gray - 70) / 110, 0, 1) * 255
    logo_alpha[~(region(gray.shape, LOGO_BOX) & inside)] = 0

    # Traçado: linhas finas mais claras que o tecido ao redor (top-hat)
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    track_alpha = np.clip((tophat - 10) / 35, 0, 1) * 255
    track_alpha[~(region(gray.shape, TRACK_BOX) & inside)] = 0
    logo_zone = cv2.dilate((logo_alpha > 10).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    track_alpha[logo_zone] = 0

    # Bandeira: pixels saturados ou claros (a faixa branca não tem cor)
    sat = hsv[..., 1].astype(np.float32)
    flag_alpha = np.maximum(np.clip((sat - 45) / 70, 0, 1), np.clip((gray - 50) / 60, 0, 1)) * 255
    flag_alpha[~(region(gray.shape, FLAG_BOX) & inside)] = 0
    flag_alpha = cv2.GaussianBlur(flag_alpha, (3, 3), 0)

    # Malha lisa: tira a estampa e refaz o tecido preto com o sombreado ao redor
    hole = ((logo_alpha > 4) | (track_alpha > 6) | (flag_alpha > 6)).astype(np.uint8)
    hole = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
    fabric = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)  # camiseta preta: sem cor, some o tom verde/amarelo
    filled = cv2.inpaint(fabric, hole, 15, cv2.INPAINT_TELEA).astype(np.float32)
    # Média local do tecido sem a estampa (dobras e luz), para não sobrar marca clara
    keep = (1 - hole).astype(np.float32) * inside
    local = cv2.GaussianBlur(fabric.astype(np.float32) * keep, (0, 0), 18) / (cv2.GaussianBlur(keep, (0, 0), 18) + 1e-3)
    region_soft = np.clip(cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 8) * 1.6, 0, 1)
    grain = np.random.default_rng(7).normal(0, 1.6, fabric.shape).astype(np.float32)
    patched = np.minimum(.55 * local + .45 * filled, local * 1.08) + grain
    plain = fabric * (1 - region_soft) + patched * region_soft
    plain = np.clip(plain, 0, 255).astype(np.uint8)
    save("layer-malha", np.dstack([plain, plain, plain, a]))

    # Traçado: refeito como linha uniforme (sem serrilhado nem textura do tecido)
    lines = (track_alpha > 70).astype(np.uint8)
    lines = cv2.morphologyEx(lines, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(lines)
    for c in range(1, count):
        if stats[c, cv2.CC_STAT_AREA] < 30:
            lines[labels == c] = 0
    skeleton = cv2.ximgproc.thinning(lines * 255) if hasattr(cv2, "ximgproc") else lines * 255
    stroke = cv2.dilate(skeleton, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    stroke = cv2.GaussianBlur(stroke.astype(np.float32), (0, 0), .7)
    save("layer-tracado", layer(np.full_like(rgb, (210, 207, 200)), np.clip(stroke * 1.4, 0, 255)))

    # Logo: cor sólida e borda nítida, como uma arte plana
    solid = np.clip((gray - 105) / 45, 0, 1)
    solid[~(region(gray.shape, LOGO_BOX) & inside)] = 0
    solid = cv2.morphologyEx(solid, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    solid = cv2.GaussianBlur(solid, (0, 0), .6)
    save("layer-logo", layer(np.full_like(rgb, (238, 235, 228)), solid * 255))

    save("layer-bandeira", layer(rgb, flag_alpha))

    # Arte das costas: centralizada no mesmo quadro, do tamanho do peito
    art = Image.open(BACK_ART).convert("RGBA")
    art.thumbnail((470, 600), Image.LANCZOS)
    frame = Image.new("RGBA", (1400, 1000), (0, 0, 0, 0))
    frame.alpha_composite(art, ((1400 - art.width) // 2 + 20, (1000 - art.height) // 2 + 40))
    save("layer-costas", np.array(frame))


if __name__ == "__main__":
    main()
