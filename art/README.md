# Art sources

Everything in this folder is covered by [CC BY-NC 4.0](../LICENSE-ART.md) (artwork) and the [PolyForm Noncommercial](../LICENSE) code licence (the scripts). None of it is needed to run the website; the site uses the finished images in `public/art/`.

| Folder | What | Tools |
| --- | --- | --- |
| `araccoon/` | The 3D raccoon mascot (`araccoon_character.blend`), its textures, web model and render scripts | [Blender](https://www.blender.org/) 4.x |
| `posters/` | Poster compositions built from the source images in `posters/source/` | Python 3 with Pillow and NumPy; run `npm install` first so the bundled fonts exist |
| `og/` | The link-preview share image (`public/og-image.jpg`) | Python 3 with Pillow |

## Rendering the mascot

Run from `art/araccoon/` (scripts find their folder themselves; set `ARACCOON_ART_DIR` to override):

```bash
blender -b araccoon_character.blend --python scripts/run.py -- steps=body_common,fur_deps,fur,site_render VIEWLIST=hero
```

Renders go to `art/araccoon/renders/`; `scripts/site_export.py` trims them into `public/art/*.webp`. Each script's header lists its own options. Render logs (`scripts/*.txt`, `build_log.json`) are ignored by git.

## Posters

```bash
python art/posters/compose.py
```

Exports go to `art/posters/<name>/` and are not committed. The mono and Japanese fonts come from the system (Consolas / Yu Gothic on Windows, Menlo / Hiragino on macOS, DejaVu / Noto CJK on Linux); if none is found the script falls back to Archivo and Japanese text will not render.
