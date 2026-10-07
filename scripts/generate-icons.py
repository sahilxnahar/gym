from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = '#24231f'
PAPER = '#f5efe4'
EMBER = '#df6a47'

for size, filename in [(192, 'icon-192.png'), (512, 'icon-512.png')]:
    scale = size / 192
    image = Image.new('RGB', (size, size), BACKGROUND)
    draw = ImageDraw.Draw(image)
    radius = 4 * scale
    # The Forge F uses the same proportions as public/icon.svg.
    draw.rounded_rectangle((48*scale, 38*scale, 140*scale, 62*scale), radius=radius, fill=PAPER)
    draw.rounded_rectangle((48*scale, 38*scale, 73*scale, 156*scale), radius=radius, fill=PAPER)
    draw.rounded_rectangle((48*scale, 84*scale, 125*scale, 107*scale), radius=radius, fill=PAPER)
    draw.polygon([(141*scale, 105*scale), (156*scale, 120*scale), (141*scale, 135*scale), (126*scale, 120*scale)], fill=EMBER)
    image.save(ROOT / 'public' / filename, format='PNG', optimize=True)
