#!/usr/bin/env python3
"""Generate 192/512 PWA icons. No network. Not a store listing asset."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)
PURPLE = (109, 74, 255, 255)
WHITE = (255, 255, 255, 255)


def mark(size: int, maskable: bool = False) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0) if maskable else PURPLE)
    draw = ImageDraw.Draw(image)
    inset = int(size * 0.18) if maskable else 0
    box = [inset, inset, size - inset - 1, size - inset - 1]
    radius = max(8, size // 5)
    draw.rounded_rectangle(box, radius=radius, fill=PURPLE)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(size * 0.46))
    except OSError:
        font = ImageFont.load_default()
    text = "A"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1] - size * 0.03), text, font=font, fill=WHITE)
    return image


def main() -> None:
    mark(192).save(OUT / "icon-192.png", "PNG")
    mark(512).save(OUT / "icon-512.png", "PNG")
    mark(512, maskable=True).save(OUT / "icon-maskable-512.png", "PNG")
    print(f"wrote icons in {OUT}")


if __name__ == "__main__":
    main()
