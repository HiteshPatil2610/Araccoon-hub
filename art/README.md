# Art sources

Everything in this folder is covered by [CC BY-NC 4.0](../LICENSE-ART.md) (artwork) and the [PolyForm Noncommercial](../LICENSE) code licence (the scripts). None of it is needed to run the website; the site uses the finished images in `public/art/`.

| Folder | What | Tools |
| --- | --- | --- |
| `posters/` | Poster compositions built from the source images in `posters/source/` | Python 3 with Pillow and NumPy; run `npm install` first so the bundled fonts exist |
| `mascot/` | The mascot PNG originals and `make_web.py`, which builds the small WebP copies in `public/art/video-concept/` | Python 3 with Pillow |
| `og/` | The link-preview share image (`public/og-image.jpg`) | Python 3 with Pillow |

## Posters

```bash
python art/posters/compose.py
```

Exports go to `art/posters/<name>/` and are not committed. The mono and Japanese fonts come from the system (Consolas / Yu Gothic on Windows, Menlo / Hiragino on macOS, DejaVu / Noto CJK on Linux); if none is found the script falls back to Archivo and Japanese text will not render.
