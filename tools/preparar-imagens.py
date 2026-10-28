"""Alinha os ângulos da camiseta e exporta em WebP.

Cada PNG de origem tem a camiseta numa posição e escala diferentes. Este
script recorta a área visível de cada um, deixa todas com a mesma altura,
centraliza num quadro único e salva duas versões (desktop e celular).

Uso:  python tools/preparar-imagens.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "prototipo" / "dist"
OUT = ROOT / "site" / "img" / "tee"

# Ordem do giro: 0°, 45°, 90° ... 315°
FRAMES = [
    "tee-front-real.png",
    "tee-front-flag.png",
    "tee-side-flag.png",
    "tee-rear-flag.png",
    "tee-back-real.png",
    "tee-rear-plain.png",
    "tee-side-plain.png",
    "tee-front-plain.png",
]

# (sufixo, largura do quadro, altura do quadro, altura da camiseta)
SIZES = [("lg", 1400, 1000, 920), ("sm", 760, 560, 510)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(FRAMES):
        img = Image.open(SRC / name).convert("RGBA")
        # Ignora pixels quase transparentes (sombras/ruído) ao medir a peça
        alpha = img.getchannel("A").point(lambda a: 255 if a > 24 else 0)
        shirt = img.crop(alpha.getbbox())
        for suffix, fw, fh, target_h in SIZES:
            scale = target_h / shirt.height
            w = round(shirt.width * scale)
            if w > fw:  # nunca ultrapassa a largura do quadro
                scale = fw / shirt.width
                w = fw
            h = round(shirt.height * scale)
            resized = shirt.resize((w, h), Image.LANCZOS)
            frame = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
            frame.alpha_composite(resized, ((fw - w) // 2, (fh - h) // 2))
            path = OUT / f"tee-{i:02d}-{suffix}.webp"
            frame.save(path, "WEBP", quality=84, method=6)
            print(f"{path.name}: {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
