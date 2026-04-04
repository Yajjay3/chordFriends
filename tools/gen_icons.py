from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('extension/icons', exist_ok=True)

for size in [16, 48, 128]:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background circle
    draw.ellipse([0, 0, size-1, size-1], fill=(26, 26, 46, 255))

    # Border
    bw = max(1, size // 25)
    draw.ellipse([bw, bw, size-1-bw, size-1-bw], outline=(245, 197, 24, 255), width=bw)

    # Music note
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Unicode.ttf', int(size * 0.45))
    except Exception:
        try:
            font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', int(size * 0.45))
        except Exception:
            font = ImageFont.load_default()

    text = '♪'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1]
    draw.text((tx, ty), text, fill=(245, 197, 24, 255), font=font)

    path = f'extension/icons/icon{size}.png'
    img.save(path)
    print(f'Created {path}')
