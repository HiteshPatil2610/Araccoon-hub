"""Builds public/og-image.jpg, the 1200x630 link-preview image for the site.

Usage: python art/og/make_og.py   (needs Pillow; run from the repo root)
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
INK, RED, WHITE, GREY = (10, 10, 10), (200, 32, 47), (255, 255, 255), (170, 170, 170)
FONTS = 'node_modules/@fontsource'


def font(name, size):
    path = {'display': f'{FONTS}/bebas-neue/files/bebas-neue-latin-400-normal.woff',
            'body': f'{FONTS}/archivo/files/archivo-latin-500-normal.woff'}[name]
    return ImageFont.truetype(path, size)


img = Image.new('RGB', (W, H), INK)
draw = ImageDraw.Draw(img)

# Crimson disc with a soft glow behind the mascot, like the site's hero.
glow = Image.new('L', (W, H), 0)
ImageDraw.Draw(glow).ellipse((700, 70, 1190, 560), fill=150)
img.paste(Image.new('RGB', (W, H), RED), (0, 0), glow.filter(ImageFilter.GaussianBlur(60)))
draw.ellipse((735, 105, 1155, 525), fill=RED)

raccoon = Image.open('public/art/video-concept/raccoon-hero-crossed-arms.png').convert('RGBA')
raccoon = raccoon.crop(raccoon.getbbox())
scale = 600 / raccoon.height
raccoon = raccoon.resize((round(raccoon.width * scale), 600), Image.LANCZOS)
img.paste(raccoon, (945 - raccoon.width // 2, H - raccoon.height), raccoon)

draw.text((70, 92), 'SMALL FINDS .  BIG EVERYDAY UPGRADES .', font=font('body', 22), fill=GREY)
draw.text((62, 140), 'RACCOON', font=font('display', 230), fill=WHITE)
draw.text((66, 352), 'HUB', font=font('display', 150), fill=RED)
draw.text((70, 528), 'Clever objects and useful oddities, hand-picked.', font=font('body', 26), fill=WHITE)

img.save('public/og-image.jpg', quality=88, optimize=True, progressive=True)
print('wrote public/og-image.jpg', img.size)
