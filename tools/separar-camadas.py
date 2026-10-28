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

    # Malha lisa: apaga tudo o que foi extraído e preenche com o tecido ao redor
    hole = ((logo_alpha > 20) | (track_alpha > 20) | (flag_alpha > 20)).astype(np.uint8)
    hole = cv2.dilate(hole, np.ones((5, 5), np.uint8))
    plain = cv2.inpaint(rgb, hole, 7, cv2.INPAINT_TELEA)
    # Escurece levemente a área preenchida para não ficar manchada
    soft = cv2.GaussianBlur(hole.astype(np.float32), (21, 21), 0)[..., None]
    plain = (plain * (1 - .25 * soft)).astype(np.uint8)

    save("layer-malha", np.dstack([plain, a]))
    # Clareia o traçado para ele aparecer quando a camada estiver solta
    track_rgb = np.clip(rgb.astype(np.float32) * 1.6 + 30, 0, 255).astype(np.uint8)
    save("layer-tracado", layer(track_rgb, track_alpha))
    save("layer-logo", layer(rgb, logo_alpha))
    save("layer-bandeira", layer(rgb, flag_alpha))

    # Arte das costas: centralizada no mesmo quadro, do tamanho do peito
    art = Image.open(BACK_ART).convert("RGBA")
    art.thumbnail((470, 600), Image.LANCZOS)
    frame = Image.new("RGBA", (1400, 1000), (0, 0, 0, 0))
    frame.alpha_composite(art, ((1400 - art.width) // 2 + 20, (1000 - art.height) // 2 + 40))
    save("layer-costas", np.array(frame))


if __name__ == "__main__":
    main()
