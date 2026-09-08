# 🐸 La Ranita Aventurera

Juego interactivo multi-nivel en PowerPoint.

## Archivo

`La_Ranita_Aventurera.pptx`

## Cómo jugar

1. Abre el archivo en PowerPoint y pulsa **F5**.
2. **Empezar aventura** → entra al **Nivel 1 (Laguna)**.
3. Haz clic en el **siguiente nenúfar** (el camino va de izquierda a derecha).
4. Verás una animación corta de salto (avanza sola).
5. Completa **6 saltos** → cambia el escenario.
6. Niveles: **Laguna → Bosque → Selva** → victoria.

## Hojas frágiles (perder)

- Casi todas las hojas son seguras.
- En algunos niveles hay **1 hoja frágil** (se ve igual).
- Si caes: animación **CRACK → caída → splash**.
- Luego **Continuar** y la ranita sigue en una hoja firme (no te quedas trabado).

Para otras hojas frágiles: cambia `RNG_SEED` en `create_frog_game.py` y vuelve a generar.

## Tips

- Solo funcionan los clics en nenúfares / botones / meta azul.
- Salir: **Esc**.
- Sonidos generados están en `assets/*.wav` — puedes insertarlos a mano en PowerPoint (*Insertar → Audio*) si quieres aplausos o splash.

## Regenerar

```bash
python create_frog_game.py
```
