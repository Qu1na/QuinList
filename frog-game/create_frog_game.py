"""
La Ranita Aventurera — juego multi-nivel en PowerPoint.

Niveles: Laguna → Bosque → Selva (6 saltos cada uno).
Algunas hojas (pocas) son frágiles: se rompen y la rana cae
(secuencia animada). Tras caer, reintentar continúa el nivel
en una hoja firme (para no bloquear al niño).

PowerPoint no tiene random en vivo sin macros: las hojas frágiles
se eligen al generar el archivo. Cambia RNG_SEED para reordenarlas.
"""

from __future__ import annotations

import math
import random
import struct
import wave
from dataclasses import dataclass
from pathlib import Path

from lxml import etree
from PIL import Image, ImageDraw, ImageFilter
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "La_Ranita_Aventurera.pptx"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

CREAM = RGBColor(0xFE, 0xFA, 0xE0)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x14, 0x28, 0x1E)
GOLD = RGBColor(0xF4, 0xA2, 0x61)
ORANGE = RGBColor(0xE7, 0x6F, 0x51)

STEPS_PER_LEVEL = 6
RNG_SEED = 42  # cambia para otras hojas frágiles


@dataclass
class Theme:
    key: str
    name: str
    subtitle: str
    sky_top: tuple[int, int, int]
    sky_bot: tuple[int, int, int]
    water: tuple[int, int, int]
    land: tuple[int, int, int]
    accent: tuple[int, int, int]
    banner: RGBColor
    deco: str


LEVELS = [
    Theme(
        "laguna",
        "Nivel 1 — Laguna al amanecer",
        "Salta 6 veces hasta la orilla brillante",
        (255, 183, 140),
        (120, 180, 200),
        (40, 120, 170),
        (70, 140, 90),
        (255, 200, 100),
        RGBColor(0x1B, 0x3A, 0x4B),
        "reeds",
    ),
    Theme(
        "bosque",
        "Nivel 2 — Bosque misterioso",
        "Entre musgo y troncos… ¡cuidado con hojas frágiles!",
        (90, 130, 90),
        (40, 80, 55),
        (30, 90, 100),
        (45, 90, 50),
        (180, 220, 140),
        RGBColor(0x1B, 0x2E, 0x1F),
        "trees",
    ),
    Theme(
        "selva",
        "Nivel 3 — Selva tropical",
        "¡Último tramo! Lleva a la ranita a su hogar",
        (30, 90, 60),
        (20, 50, 40),
        (20, 80, 110),
        (35, 100, 55),
        (255, 120, 80),
        RGBColor(0x0D, 0x28, 0x1A),
        "vines",
    ),
]


def rgb_pptx(c: tuple[int, int, int]) -> RGBColor:
    return RGBColor(c[0], c[1], c[2])


# ---------- AUDIO (opcionales; el PPT funciona sin ellos incrustados) ----------
def tone_wav(path: Path, freqs, duration=0.25, volume=0.35, sample_rate=22050):
    n = int(sample_rate * duration)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        for i in range(n):
            t = i / sample_rate
            env = min(1.0, i / (sample_rate * 0.02)) * max(0.0, 1 - i / n)
            val = sum(math.sin(2 * math.pi * f * t) for f in freqs) / len(freqs)
            w.writeframes(struct.pack("<h", int(val * volume * env * 32767)))
    return path


def splash_wav(path: Path, duration=0.55, sample_rate=22050):
    n = int(sample_rate * duration)
    rng = random.Random(9)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        for i in range(n):
            t = i / sample_rate
            env = math.exp(-3.2 * t)
            noise = rng.uniform(-1, 1)
            bubble = 0.4 * math.sin(2 * math.pi * (90 + 40 * t) * t)
            val = max(-1, min(1, (0.55 * noise + bubble) * env * 0.4))
            w.writeframes(struct.pack("<h", int(val * 32767)))
    return path


def make_sounds():
    ASSETS.mkdir(parents=True, exist_ok=True)
    return {
        "jump": tone_wav(ASSETS / "jump.wav", [520, 780], 0.18),
        "ok": tone_wav(ASSETS / "ok.wav", [660, 880, 1100], 0.35),
        "fail": tone_wav(ASSETS / "fail.wav", [220, 180], 0.4, volume=0.3),
        "splash": splash_wav(ASSETS / "splash.wav"),
        "win": tone_wav(ASSETS / "win.wav", [523, 659, 784, 1046], 0.7, volume=0.3),
    }


# ---------- IMAGES ----------
def _ellipse(d, box, fill, outline=None, width=3):
    d.ellipse(box, fill=fill, outline=outline, width=width)


def make_frog(path: Path, size=280, scared=False) -> Path:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _ellipse(d, (50, 90, 230, 250), "#4CAF50", "#2E7D32", 4)
    _ellipse(d, (90, 140, 190, 230), "#C8E6C9")
    _ellipse(d, (70, 40, 130, 100), "#66BB6A", "#2E7D32", 3)
    _ellipse(d, (150, 40, 210, 100), "#66BB6A", "#2E7D32", 3)
    _ellipse(d, (85, 55, 115, 85), "#FFFFFF")
    _ellipse(d, (165, 55, 195, 85), "#FFFFFF")
    if scared:
        _ellipse(d, (90, 58, 112, 82), "#1B1B1B")
        _ellipse(d, (170, 58, 192, 82), "#1B1B1B")
        d.arc((105, 175, 175, 215), 200, 340, fill="#1B5E20", width=4)
    else:
        _ellipse(d, (92, 62, 108, 78), "#1B1B1B")
        _ellipse(d, (172, 62, 188, 78), "#1B1B1B")
        d.arc((105, 165, 175, 210), 20, 160, fill="#1B5E20", width=4)
    _ellipse(d, (70, 155, 95, 175), "#81C784")
    _ellipse(d, (185, 155, 210, 175), "#81C784")
    _ellipse(d, (40, 210, 100, 255), "#43A047", "#2E7D32", 3)
    _ellipse(d, (180, 210, 240, 255), "#43A047", "#2E7D32", 3)
    img.save(path)
    return path


def make_lily(path: Path, color="#66BB6A", cracked=False, size=220) -> Path:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _ellipse(d, (10, 20, 210, 200), color, "#1B5E20", 4)
    d.polygon([(110, 110), (205, 50), (205, 170)], fill=(0, 0, 0, 0))
    d.line([(110, 110), (55, 70)], fill="#2E7D32", width=2)
    d.line([(110, 110), (75, 165)], fill="#2E7D32", width=2)
    d.line([(110, 110), (155, 155)], fill="#2E7D32", width=2)
    cx, cy = 85, 95
    for ang in range(0, 360, 60):
        x = cx + int(16 * math.cos(math.radians(ang)))
        y = cy + int(16 * math.sin(math.radians(ang)))
        _ellipse(d, (x - 9, y - 9, x + 9, y + 9), "#F48FB1")
    _ellipse(d, (cx - 7, cy - 7, cx + 7, cy + 7), "#FFEB3B")
    if cracked:
        d.line([(60, 60), (130, 140)], fill="#3E2723", width=4)
        d.line([(140, 55), (90, 150)], fill="#3E2723", width=3)
        d.line([(50, 130), (100, 100)], fill="#3E2723", width=3)
        d.polygon([(95, 100), (145, 70), (150, 120)], fill=(0, 100, 160, 180))
    img.save(path)
    return path


def make_half_lily(path: Path, size=220) -> Path:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _ellipse(d, (10, 20, 210, 200), "#66BB6A", "#1B5E20", 4)
    d.rectangle((110, 0, size, size), fill=(0, 0, 0, 0))
    d.line([(100, 40), (120, 180)], fill="#3E2723", width=5)
    img.save(path)
    return path


def make_splash(path: Path, size=280) -> Path:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _ellipse(d, (40, 120, 240, 240), "#4FC3F7", "#0277BD", 3)
    for i in range(10):
        ang = i * 36
        x = 140 + int(70 * math.cos(math.radians(ang)))
        y = 140 + int(50 * math.sin(math.radians(ang))) - 30
        _ellipse(d, (x - 12, y - 18, x + 12, y + 18), "#E1F5FE")
    _ellipse(d, (110, 90, 170, 140), "#B3E5FC")
    img.save(path)
    return path


def make_bg(path: Path, theme: Theme, w=1920, h=1080) -> Path:
    img = Image.new("RGB", (w, h), theme.sky_bot)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        r = int(theme.sky_top[0] * (1 - t) + theme.sky_bot[0] * t)
        g = int(theme.sky_top[1] * (1 - t) + theme.sky_bot[1] * t)
        b = int(theme.sky_top[2] * (1 - t) + theme.sky_bot[2] * t)
        d.line([(0, y), (w, y)], fill=(r, g, b))

    d.ellipse((-300, 620, 2200, 1400), fill=theme.water)
    wr = tuple(min(255, c + 40) for c in theme.water)
    d.arc((200, 700, 700, 850), 200, 340, fill=wr, width=4)
    d.arc((900, 740, 1500, 900), 200, 340, fill=wr, width=4)
    d.ellipse((-100, 880, 500, 1200), fill=theme.land)
    d.ellipse((1500, 900, 2100, 1200), fill=theme.land)

    if theme.deco == "reeds":
        for x in range(40, 500, 28):
            d.line([(x, 950), (x + 8, 720)], fill=(40, 100, 50), width=4)
            d.ellipse((x + 2, 700, x + 16, 720), fill=(200, 160, 40))
        for x in range(1500, 1880, 30):
            d.line([(x, 980), (x - 6, 740)], fill=(40, 100, 50), width=4)
        _ellipse(d, (1500, 80, 1750, 330), theme.accent)
    elif theme.deco == "trees":
        for x, hgt in ((120, 420), (280, 500), (1600, 460), (1780, 380)):
            d.rectangle((x + 35, 500, x + 55, 900), fill=(80, 50, 30))
            d.ellipse((x - 20, 420, x + 110, 560), fill=(40, 110, 55))
            d.ellipse((x, 500 - hgt // 2, x + 90, 560), fill=(30, 90, 45))
        for x, y in ((600, 200), (900, 150), (1100, 260), (1300, 180)):
            _ellipse(d, (x, y, x + 10, y + 10), (255, 255, 150))
    else:
        for x in (80, 200, 1700, 1820):
            d.rectangle((x, 0, x + 40, 700), fill=(40, 70, 30))
            d.ellipse((x - 40, 80, x + 80, 220), fill=(20, 120, 50))
            d.ellipse((x - 30, 200, x + 90, 360), fill=(30, 140, 60))
        for x in range(400, 1500, 120):
            d.arc((x, -40, x + 80, 300), 0, 180, fill=(20, 100, 40), width=5)
        cx, cy = 960, 160
        for ang in range(0, 360, 45):
            x = cx + int(40 * math.cos(math.radians(ang)))
            y = cy + int(40 * math.sin(math.radians(ang)))
            _ellipse(d, (x - 18, y - 18, x + 18, y + 18), theme.accent)

    img = img.filter(ImageFilter.SMOOTH)
    img.save(path)
    return path


def make_assets():
    ASSETS.mkdir(parents=True, exist_ok=True)
    paths = {
        "frog": make_frog(ASSETS / "frog.png"),
        "frog_scared": make_frog(ASSETS / "frog_scared.png", scared=True),
        "lily": make_lily(ASSETS / "lily.png"),
        "lily_crack": make_lily(ASSETS / "lily_crack.png", cracked=True),
        "lily_half": make_half_lily(ASSETS / "lily_half.png"),
        "splash": make_splash(ASSETS / "splash.png"),
        "sounds": make_sounds(),
    }
    for th in LEVELS:
        paths[f"bg_{th.key}"] = make_bg(ASSETS / f"bg_{th.key}.png", th)
    return paths


# ---------- PPT HELPERS ----------
def set_run(p, text, size, bold=False, color=CREAM):
    p.clear()
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Comic Sans MS"


def add_textbox(slide, left, top, width, height, text, size=24, bold=False, color=CREAM, align=PP_ALIGN.CENTER):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    set_run(p, text, size, bold, color)
    return box


def add_pic(slide, path, left, top, width=None, height=None):
    kw = {}
    if width is not None:
        kw["width"] = width
    if height is not None:
        kw["height"] = height
    return slide.shapes.add_picture(str(path), left, top, **kw)


def add_bg(slide, path):
    add_pic(slide, path, 0, 0, width=SLIDE_W, height=SLIDE_H)


def banner(slide, theme: Theme, title: str, sub: str | None = None):
    h = Inches(1.15 if sub else 0.85)
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(0.2), Inches(12.3), h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = theme.banner
    shape.line.fill.background()
    add_textbox(slide, Inches(0.5), Inches(0.28), Inches(12.3), Inches(0.5), title, 26, True, CREAM)
    if sub:
        add_textbox(slide, Inches(0.5), Inches(0.78), Inches(12.3), Inches(0.4), sub, 14, False, RGBColor(0xC8, 0xE6, 0xC9))


def button(slide, left, top, width, height, text, fill, text_color=WHITE):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill
    shp.line.fill.background()
    tf = shp.text_frame
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    set_run(tf.paragraphs[0], text, 22, True, text_color)
    tf.paragraphs[0].space_before = Pt(10)
    return shp


def link(shape, prs, idx: int):
    shape.click_action.target_slide = prs.slides[idx]


def hot(slide, prs, left, top, w, h, idx: int):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, w, h)
    shp.fill.background()
    shp.line.fill.background()
    link(shp, prs, idx)
    return shp


def set_transition(slide, advance_seconds: float | None = None, click=False):
    ln = slide._element
    for child in list(ln):
        if child.tag == qn("p:transition"):
            ln.remove(child)
    tr = etree.SubElement(ln, qn("p:transition"))
    tr.set("advClick", "1" if click else "0")
    if advance_seconds is not None:
        tr.set("advTm", str(int(advance_seconds * 1000)))
        etree.SubElement(tr, qn("p:fade"))


def pad_positions(n=6):
    xs = [1.2, 3.0, 4.8, 6.6, 8.4, 10.2]
    ys = [4.8, 3.6, 5.0, 3.4, 4.9, 3.7]
    return [(Inches(xs[i]), Inches(ys[i])) for i in range(n)]


# ---------- BUILD ----------
def build(assets: dict) -> tuple[Presentation, set]:
    rng = random.Random(RNG_SEED)
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    positions = pad_positions()

    # ~50% de niveles tienen 1 hoja frágil (no la primera)
    fragile: set[tuple[int, int]] = set()
    for li in range(len(LEVELS)):
        if rng.random() < 0.55:
            fragile.add((li, rng.randint(1, STEPS_PER_LEVEL - 1)))

    def new_slide():
        return prs.slides.add_slide(blank)

    def draw_path(slide, theme, frog_step=None, shore=False, cracked_step=None, frog_air=None, scared=False):
        add_bg(slide, assets[f"bg_{theme.key}"])
        for i, p in enumerate(positions):
            if cracked_step == i:
                add_pic(slide, assets["lily_crack"], p[0], p[1], width=Inches(1.35))
                add_pic(slide, assets["lily_half"], p[0] + Inches(0.55), p[1] + Inches(0.35), width=Inches(0.95))
            else:
                add_pic(slide, assets["lily"], p[0], p[1], width=Inches(1.35))
        goal = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(11.5), Inches(3.2), Inches(1.4), Inches(1.4))
        goal.fill.solid()
        goal.fill.fore_color.rgb = rgb_pptx(theme.water)
        goal.line.color.rgb = WHITE
        frog = assets["frog_scared"] if scared else assets["frog"]
        if shore:
            add_pic(slide, frog, Inches(0.45), Inches(4.3), width=Inches(1.15))
        elif frog_air is not None:
            add_pic(slide, frog, Inches(frog_air[0]), Inches(frog_air[1]), width=Inches(1.1))
        elif frog_step is not None:
            fx, fy = positions[frog_step]
            add_pic(slide, frog, fx + Inches(0.1), fy - Inches(0.55), width=Inches(1.1))

    # TITLE
    s = new_slide()
    add_bg(s, assets["bg_laguna"])
    panel = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.4), Inches(0.9), Inches(10.5), Inches(2.8))
    panel.fill.solid()
    panel.fill.fore_color.rgb = RGBColor(0x12, 0x2A, 0x22)
    panel.line.fill.background()
    add_textbox(s, Inches(1.4), Inches(1.1), Inches(10.5), Inches(0.9), "🐸 La Ranita Aventurera", 42, True, CREAM)
    add_textbox(
        s,
        Inches(1.8),
        Inches(2.15),
        Inches(9.7),
        Inches(1.2),
        "Laguna → Bosque → Selva  ·  6 saltos por nivel\nCasi todas las hojas son seguras… ¡pero algunas se rompen!",
        18,
        False,
        RGBColor(0xD8, 0xF3, 0xDC),
    )
    add_pic(s, assets["frog"], Inches(5.8), Inches(3.9), width=Inches(1.6))
    title_btn = button(s, Inches(4.4), Inches(5.8), Inches(4.5), Inches(0.95), "▶  Empezar aventura", ORANGE)
    set_transition(s, click=False)

    first_level_idx = None

    for li, theme in enumerate(LEVELS):
        # Level intro
        s = new_slide()
        intro_idx = len(prs.slides) - 1
        if li == 0:
            first_level_idx = intro_idx
        add_bg(s, assets[f"bg_{theme.key}"])
        banner(s, theme, theme.name, theme.subtitle)
        add_pic(s, assets["frog"], Inches(5.7), Inches(3.0), width=Inches(1.8))
        add_textbox(
            s,
            Inches(1.5),
            Inches(5.0),
            Inches(10.3),
            Inches(0.5),
            "Las hojas frágiles se ven iguales… ¡casi nunca se rompen!",
            16,
            False,
            CREAM,
        )
        intro_btn = button(s, Inches(4.5), Inches(5.8), Inches(4.3), Inches(0.9), "¡Entrar al nivel! ▶", GOLD, DARK)
        set_transition(s, click=False)

        # Shore
        s = new_slide()
        shore_idx = len(prs.slides) - 1
        draw_path(s, theme, shore=True)
        banner(s, theme, theme.name, f"Salto 1/{STEPS_PER_LEVEL} — toca el primer nenúfar 🪷")
        set_transition(s, click=False)
        link(intro_btn, prs, shore_idx)

        current_slide = s
        current_frog_step = -1

        for step in range(STEPS_PER_LEVEL):
            is_fragile = (li, step) in fragile
            if current_frog_step < 0:
                from_xy = (0.45, 4.3)
            else:
                p = positions[current_frog_step]
                from_xy = (p[0].inches + 0.1, p[1].inches - 0.55)
            to_pos = positions[step]
            ax = (from_xy[0] + to_pos[0].inches) / 2
            ay = min(from_xy[1], to_pos[1].inches) - 1.15

            if is_fragile:
                # mid-air
                s = new_slide()
                mid_idx = len(prs.slides) - 1
                draw_path(s, theme, frog_air=(ax, ay))
                banner(s, theme, "🦘 ¡Salto!", "…")
                set_transition(s, advance_seconds=0.4, click=False)

                # crack
                s = new_slide()
                draw_path(s, theme, frog_step=step, cracked_step=step, scared=True)
                banner(s, theme, "💥 ¡CRACK!", "¡La hoja era frágil!")
                set_transition(s, advance_seconds=0.55, click=False)

                # falling
                s = new_slide()
                draw_path(
                    s,
                    theme,
                    cracked_step=step,
                    frog_air=(to_pos[0].inches + 0.2, to_pos[1].inches + 0.85),
                    scared=True,
                )
                banner(s, theme, "😱 ¡Se rompió!", "La ranita cae al agua…")
                set_transition(s, advance_seconds=0.5, click=False)

                # splash
                s = new_slide()
                add_bg(s, assets[f"bg_{theme.key}"])
                add_pic(s, assets["splash"], Inches(5.5), Inches(3.2), width=Inches(2.2))
                banner(s, theme, "💦 ¡Plash!", "")
                set_transition(s, advance_seconds=0.55, click=False)

                # retry → continues on firm leaf (kid-friendly)
                s = new_slide()
                add_bg(s, assets[f"bg_{theme.key}"])
                panel = s.shapes.add_shape(
                    MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.0), Inches(1.8), Inches(9.3), Inches(3.0)
                )
                panel.fill.solid()
                panel.fill.fore_color.rgb = RGBColor(0x4A, 0x15, 0x0C)
                panel.line.fill.background()
                add_textbox(s, Inches(2), Inches(2.1), Inches(9.3), Inches(0.7), "💧 ¡Al agua!", 36, True, RGBColor(0xFF, 0xCD, 0xD2))
                add_textbox(
                    s,
                    Inches(2.3),
                    Inches(3.0),
                    Inches(8.7),
                    Inches(1.2),
                    "Esa hoja se partió… ¡pasa muy pocas veces!\nLa ranita encontró otra hoja firme. ¡Sigue!",
                    18,
                    False,
                    CREAM,
                )
                add_pic(s, assets["frog_scared"], Inches(6.0), Inches(4.5), width=Inches(1.2))
                retry = button(s, Inches(4.5), Inches(6.0), Inches(4.3), Inches(0.85), "Continuar ▶", GOLD, DARK)
                set_transition(s, click=False)

                hot(current_slide, prs, to_pos[0], to_pos[1], Inches(1.35), Inches(1.3), mid_idx)

                # firm landing after continue
                s = new_slide()
                land_idx = len(prs.slides) - 1
                draw_path(s, theme, frog_step=step)
                sub = (
                    "Ahora sí… ¡hoja firme! Sigue 🪷"
                    if step < STEPS_PER_LEVEL - 1
                    else "¡Toca la meta azul del nivel!"
                )
                banner(s, theme, f"⭐ Salto {step + 1}/{STEPS_PER_LEVEL}", sub)
                set_transition(s, click=False)
                link(retry, prs, land_idx)

                current_slide = s
                current_frog_step = step
            else:
                # success mid-air
                s = new_slide()
                mid_idx = len(prs.slides) - 1
                draw_path(s, theme, frog_air=(ax, ay))
                banner(s, theme, "🦘 ¡Salto!", f"Salto {step + 1}/{STEPS_PER_LEVEL}")
                set_transition(s, advance_seconds=0.35, click=False)

                # land
                s = new_slide()
                land_idx = len(prs.slides) - 1
                draw_path(s, theme, frog_step=step)
                sub = (
                    "La hoja aguantó. Toca el siguiente nenúfar."
                    if step < STEPS_PER_LEVEL - 1
                    else "¡Toca la meta azul del nivel!"
                )
                banner(s, theme, f"⭐ ¡Muy bien!  {step + 1}/{STEPS_PER_LEVEL}", sub)
                for ox, oy in ((0.9, -0.3), (1.3, -0.5), (0.5, -0.6)):
                    sp = s.shapes.add_shape(
                        MSO_SHAPE.SUN,
                        positions[step][0] + Inches(ox),
                        positions[step][1] + Inches(oy),
                        Inches(0.3),
                        Inches(0.3),
                    )
                    sp.fill.solid()
                    sp.fill.fore_color.rgb = GOLD
                    sp.line.fill.background()
                set_transition(s, click=False)

                hot(current_slide, prs, to_pos[0], to_pos[1], Inches(1.35), Inches(1.3), mid_idx)
                current_slide = s
                current_frog_step = step

        # level complete
        s = new_slide()
        clear_idx = len(prs.slides) - 1
        add_bg(s, assets[f"bg_{theme.key}"])
        banner(s, theme, "🏁 ¡Nivel completado!", theme.name)
        add_pic(s, assets["frog"], Inches(5.7), Inches(3.0), width=Inches(1.8))
        add_textbox(s, Inches(1.5), Inches(5.0), Inches(10.3), Inches(0.5), "La ranita cruzó este escenario 💚", 18, False, CREAM)
        set_transition(s, advance_seconds=1.2, click=False)
        hot(current_slide, prs, Inches(11.5), Inches(3.2), Inches(1.4), Inches(1.4), clear_idx)

        if li < len(LEVELS) - 1:
            s = new_slide()
            nxt = LEVELS[li + 1]
            add_bg(s, assets[f"bg_{nxt.key}"])
            banner(s, nxt, "✨ Nuevo escenario desbloqueado", nxt.name)
            add_textbox(s, Inches(2), Inches(3.5), Inches(9.3), Inches(1), "El paisaje cambia… ¡la aventura continúa!", 22, True, CREAM)
            set_transition(s, advance_seconds=1.4, click=False)

    # VICTORY
    s = new_slide()
    add_bg(s, assets["bg_selva"])
    rnd = random.Random(3)
    colors = [GOLD, ORANGE, WHITE, RGBColor(0x4F, 0xC3, 0xF7), RGBColor(0xF4, 0x8F, 0xB1)]
    for _ in range(55):
        x = Inches(rnd.uniform(0.2, 12.8))
        y = Inches(rnd.uniform(0.2, 7.0))
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL, x, y, Inches(0.16), Inches(0.16))
        dot.fill.solid()
        dot.fill.fore_color.rgb = colors[rnd.randint(0, 4)]
        dot.line.fill.background()
    panel = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.1), Inches(10.3), Inches(3.5))
    panel.fill.solid()
    panel.fill.fore_color.rgb = RGBColor(0x0D, 0x28, 0x1A)
    panel.line.fill.background()
    add_textbox(s, Inches(1.5), Inches(1.3), Inches(10.3), Inches(0.8), "🎉 ¡LO LOGRASTE! 🎉", 42, True, GOLD)
    add_textbox(s, Inches(1.8), Inches(2.3), Inches(9.7), Inches(0.7), "🐸💦  La ranita llegó a casa  🏡💚", 28, True, CREAM)
    add_textbox(
        s,
        Inches(2.0),
        Inches(3.2),
        Inches(9.3),
        Inches(1.0),
        "Cruzaste la laguna, el bosque y la selva.\n¡Eres una guía de ranitas de primera!",
        18,
        False,
        RGBColor(0xD8, 0xF3, 0xDC),
    )
    add_pic(s, assets["frog"], Inches(5.7), Inches(4.85), width=Inches(1.7))
    again = button(s, Inches(4.5), Inches(6.5), Inches(4.3), Inches(0.7), "Jugar otra vez ▶", RGBColor(0x52, 0xB7, 0x88), DARK)
    link(again, prs, 0)
    set_transition(s, click=False)

    link(title_btn, prs, first_level_idx)

    try:
        if prs._element.tag == qn("p:presentation"):
            prs._element.set("browseMode", "browseKiosk")
    except Exception:
        pass

    return prs, fragile


def main():
    print("Generando arte y sonidos…")
    assets = make_assets()
    print("Armando niveles…")
    prs, fragile = build(assets)
    prs.save(OUTPUT)
    print(f"Listo: {OUTPUT}")
    print(f"Diapositivas: {len(prs.slides)}")
    print(f"Hojas frágiles (nivel, salto 0-5): {sorted(fragile)}")


if __name__ == "__main__":
    main()
