# Camiseta preta de terceirão: costas com letreiro empilhado + ano + nome; frente com emblema no peito
# (padrão mais comum nas camisetas de terceirão vendidas no Brasil)
from comum import *
from malha import frente, costas, sombreamento

K = 3
BRANCO = (244, 241, 233)


def texto_centro(d, cx, y, s, f, cor, espaco=0):
    larg = sum(d.textlength(ch, font=f) for ch in s) + espaco * (len(s) - 1)
    x = cx - larg / 2
    for ch in s:
        d.text((x, y), ch, font=f, fill=cor)
        x += d.textlength(ch, font=f) + espaco
    return larg


def ouro_em(mascara):
    o = gradiente_dourado(*mascara.size)
    return Image.merge('RGBA', (*o.split(), mascara))


# ---------- costas ----------
W, H = 420 * K, 640 * K
cx = W // 2
letreiro = Image.new('L', (W, H), 0)
dl = ImageDraw.Draw(letreiro)
f_big = fonte('Anton.ttf', 128 * K)
for i, sil in enumerate(['TER', 'CEI', 'RÃO']):
    texto_centro(dl, cx, (62 + i * 146) * K, sil, f_big, 255, espaco=2 * K)
# sombra dourada deslocada (efeito 3D comum nesses letreiros)
sombra_ouro = ouro_em(ImageChops.offset(letreiro, 7 * K, 7 * K))
branco = Image.merge('RGBA', (*Image.new('RGB', (W, H), BRANCO).split(), letreiro))
arte = Image.alpha_composite(sombra_ouro, branco)

extra = Image.new('L', (W, H), 0)
de = ImageDraw.Draw(extra)
texto_centro(de, cx, 14 * K, 'FORMANDOS', fonte('Oswald.ttf', 30 * K, 600), 255, espaco=10 * K)
texto_centro(de, cx, 530 * K, '2026', fonte('Anton.ttf', 52 * K), 255, espaco=8 * K)
de.rectangle((cx - 190 * K, 558 * K, cx - 110 * K, 561 * K), fill=255)
de.rectangle((cx + 110 * K, 558 * K, cx + 190 * K, 561 * K), fill=255)
arte = Image.alpha_composite(arte, ouro_em(extra))
arte = arte.crop(arte.getbbox())

nome = Image.new('L', (W, 80 * K), 0)
texto_centro(ImageDraw.Draw(nome), cx, 0, 'GABRIEL', fonte('Oswald.ttf', 46 * K, 600), 255, espaco=6 * K)
nome = Image.merge('RGBA', (*Image.new('RGB', nome.size, BRANCO).split(), nome))
nome = nome.crop(nome.getbbox())


def colar(base, arte, cx, y, larg, s, alfa, tinta=.45):
    a = arte.resize((larg, int(arte.height * larg / arte.width)), Image.LANCZOS)
    a = granulado(a, .025)
    return aplicar_estampa(base.convert('RGB'), a, (int(cx - larg / 2), y), s, alfa, opacidade=.97, tinta=tinta)


tras = costas()
s, alfa = sombreamento(tras)
img = colar(tras, arte, 712, 168, 310, s, alfa)
img = colar(img, nome, 712, 655, 165, s, alfa)
tras_final = img.convert('RGBA')
tras_final.putalpha(tras.split()[3])

# ---------- frente: emblema pequeno no peito ----------
E = 200 * K
emb = Image.new('L', (E, E), 0)
dm = ImageDraw.Draw(emb)
dm.ellipse((6 * K, 6 * K, E - 6 * K, E - 6 * K), outline=255, width=5 * K)
dm.ellipse((20 * K, 20 * K, E - 20 * K, E - 20 * K), outline=255, width=2 * K)
texto_centro(dm, E // 2, 38 * K, '3º', fonte('Anton.ttf', 70 * K), 255)
texto_centro(dm, E // 2, 122 * K, 'ANO · 26', fonte('Oswald.ttf', 24 * K, 700), 255, espaco=3 * K)
emblema = ouro_em(emb)

fr = frente()
s2, alfa2 = sombreamento(fr)
img2 = colar(fr, emblema, 805, 225, 92, s2, alfa2, tinta=.4)
frente_final = img2.convert('RGBA')
frente_final.putalpha(fr.split()[3])

salvar(recorte_4x5(tras_final, 700, 500, 860), 'terceirao-a')
salvar(recorte_4x5(frente_final, 700, 500, 860), 'terceirao-b')
print('ok')
