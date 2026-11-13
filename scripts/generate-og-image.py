"""
Genera public/image/og/quinlist-og.png (1200x630) para Open Graph / X / WhatsApp / LinkedIn.

Uso:  python scripts/generate-og-image.py
Requiere Pillow. Usa fuentes Segoe UI (Windows) o DejaVu (Linux) si están disponibles.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "image" / "og" / "quinlist-og.png"
LOGO = ROOT / "public" / "image" / "logo" / "logo-512.png"

W, H = 1200, 630
CORAL = (244, 132, 95)
SKY = (91, 188, 228)
INK = (45, 45, 45)
GREY = (102, 102, 102)


def font(bold: bool, size: int):
    candidates = (
        ["C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
    )
    for c in candidates:
        if Path(c).exists():
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


img = Image.new("RGB", (W, H), (255, 255, 255))

# Fondos suaves de marca
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
g = ImageDraw.Draw(glow)
g.ellipse((700, -250, 1450, 450), fill=CORAL + (70,))
g.ellipse((-300, 330, 450, 950), fill=SKY + (60,))
glow = glow.filter(ImageFilter.GaussianBlur(120))
img.paste(glow, (0, 0), glow)

d = ImageDraw.Draw(img)

# Logo + marca
if LOGO.exists():
    logo = Image.open(LOGO).convert("RGBA").resize((96, 96))
    img.paste(logo, (80, 72), logo)
d.text((196, 88), "QuinList", font=font(True, 54), fill=INK)

# Titular
d.text((80, 220), "Software de gestión de proyectos", font=font(True, 60), fill=INK)
d.text((80, 295), "y finanzas para empresas", font=font(True, 60), fill=CORAL)

# Subtítulo
d.text(
    (80, 395),
    "Kanban · Gantt · Presupuesto · Riesgos · Chat · IA",
    font=font(False, 32),
    fill=GREY,
)

# Pastilla CTA
pill = (80, 480, 370, 548)
d.rounded_rectangle(pill, radius=34, fill=CORAL)
d.text((112, 492), "Empieza gratis", font=font(True, 32), fill=(255, 255, 255))
d.text((400, 494), "quinlist.matubyte.com", font=font(False, 30), fill=GREY)

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print(f"OK -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
