# Base da camiseta gola redonda (a mesma do site): frente lisa e costas geradas a partir dela
from comum import *

MALHA = os.path.join(RAIZ, 'site', 'img', 'layers', 'layer-malha-lg.webp')


def frente():
    return Image.open(MALHA).convert('RGBA')


def costas():
    """Espelha a frente e fecha o decote: some a gola da frente e fica só a gola de trás."""
    im = np.asarray(frente()).copy()
    rgb = cv2.cvtColor(im[..., :3], cv2.COLOR_RGB2BGR)
    topo = [(566, 62), (605, 57), (650, 57), (700, 61), (760, 67), (810, 75), (845, 85), (862, 95)]
    baixo = [(866, 112), (858, 130), (822, 152), (770, 162), (720, 159), (670, 149), (620, 128), (585, 100), (566, 74)]
    m = np.zeros(rgb.shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(topo + baixo, np.int32)], 255)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    rgb = cv2.inpaint(rgb, m, 21, cv2.INPAINT_TELEA)
    # textura de malha por cima do trecho preenchido (o inpaint deixa liso demais)
    ruido = np.random.default_rng(7).normal(0, 3.2, rgb.shape[:2])
    suave = cv2.GaussianBlur(m.astype(np.float32) / 255, (15, 15), 0)
    rgb = np.clip(rgb.astype(np.float32) + (ruido * suave)[..., None], 0, 255).astype(np.uint8)
    # costura da gola de trás
    pts = np.array([(570, 70), (610, 66), (660, 66), (710, 70), (760, 76), (810, 84), (850, 96)], np.int32)
    cv2.polylines(rgb, [pts], False, (40, 40, 40), 2, cv2.LINE_AA)
    im[..., :3] = cv2.cvtColor(rgb, cv2.COLOR_BGR2RGB)
    return Image.fromarray(im).transpose(Image.FLIP_LEFT_RIGHT)


def sombreamento(img_rgba):
    """Luminância normalizada da camiseta preta: vira as dobras para a estampa/sublimação."""
    a = np.asarray(img_rgba).astype(np.float32)
    lum = a[..., :3].mean(-1)
    alfa = a[..., 3] > 10
    ref = np.percentile(lum[alfa], 60)
    return np.clip(lum / max(ref, 1), .2, 2.6), alfa


if __name__ == '__main__':
    c = costas()
    fundo = Image.new('RGBA', c.size, (120, 120, 120, 255))
    fundo.alpha_composite(c)
    fundo.convert('RGB').resize((700, 500)).save(os.path.join(BASE, '_costas.jpg'))
    print('ok')
