"""Generate favicons and PWA icons from logo-app.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "image" / "logo" / "logo-app.png"
OUT_DIR = ROOT / "public" / "image" / "logo"


def save_ico(png_path: Path, ico_path: Path, sizes: list[int]) -> None:
    images = []
    for size in sizes:
        im = Image.open(png_path).convert("RGBA")
        im = im.resize((size, size), Image.Resampling.LANCZOS)
        images.append(im)
    images[0].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=images[1:],
    )


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source logo: {SRC}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGBA")

    for size in [16, 32, 48, 64, 128, 192, 512]:
        resized = src.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(OUT_DIR / f"logo-{size}.png", "PNG")

    save_ico(SRC, ROOT / "public" / "favicon.ico", [16, 32, 48])
    src.resize((180, 180), Image.Resampling.LANCZOS).save(
        ROOT / "public" / "apple-touch-icon.png", "PNG"
    )

    print(f"Icons generated from {SRC.name}")


if __name__ == "__main__":
    main()
