"""Trim the transparent site renders and write web-sized WebP cut-outs into public/art (plain Python + Pillow)."""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'renders', 'site_%s.png')
OUT = os.path.join(HERE, '..', '..', '..', 'public', 'art', 'raccoon-%s.webp')

for name in ('hero', 'side', 'turn', 'rear'):
    img = Image.open(SRC % name).convert('RGBA')
    a = img.getchannel('A')
    l, t, r, _ = a.point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop((l, t, r, img.height))          # keep the bottom edge: it is the flat cut line
    if img.height > 1100:
        img = img.resize((round(img.width * 1100 / img.height), 1100), Image.LANCZOS)
    img.save(OUT % name, 'WEBP', quality=86, method=6)
    print(name, img.size, os.path.getsize(OUT % name) // 1024, 'KB')
