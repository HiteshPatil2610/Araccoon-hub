"""Builds the small (720 px tall) site copies of the mascot art from the PNG originals here.

Usage: python art/mascot/make_web.py   (needs Pillow; run from the repo root)

The closing art also keeps a full-size WebP in public/art/video-concept/ for large screens.
The box art is never shown taller than 300 CSS px, so its small copy is the only one the
site ships. The hero is shown large even on phones and the presenter art is already small,
so neither gets a small copy.
"""
from PIL import Image

SRC, OUT, HEIGHT = 'art/mascot', 'public/art/video-concept', 720
NAMES = ['raccoon-closing-heart', 'raccoon-picks-box']

for name in NAMES:
    art = Image.open(f'{SRC}/{name}.png').convert('RGBA')
    width = round(art.width * HEIGHT / art.height)
    small = art.resize((width, HEIGHT), Image.LANCZOS)
    path = f'{OUT}/{name}-720.webp'
    small.save(path, 'WEBP', quality=82, method=6, alpha_quality=90)
    print(f'{path}: {width}x{HEIGHT}')
