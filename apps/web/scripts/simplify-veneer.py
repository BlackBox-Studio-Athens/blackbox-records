"""Make the outline-simplified Veneer used by the site.

Veneer's distressed glyphs are traced polygons with up to 668 contours and 3,936 points each; Chromium spends
hundreds of milliseconds of layout on every new Veneer text size. This keeps every glyph, metric and layout table
and only simplifies the outlines:

- contours whose bounding box is smaller than MIN_CONTOUR_EXTENT font units (2048 per em) are dropped;
- the remaining contours are simplified with Ramer-Douglas-Peucker at TOLERANCE font units.

Source: the original licensed veneer_regular.woff2, SHA-256
f02b74cb53a1640c6cbfc9a2aa5f5ce0609fa358231a9b30b93c1e0072622939 (git: `git show 58218e25:apps/web/src/assets/fonts/brand/veneer_regular.woff2`).

usage (Python with `fonttools` and `brotli`):
  python apps/web/scripts/simplify-veneer.py <original.woff2> <output.woff2>
then copy the output to src/assets/fonts/brand/ and public/assets/fonts/brand/ and update check-brand-font.ts.
"""

import hashlib
import sys

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import ttProgram
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates

SOURCE_SHA256 = "f02b74cb53a1640c6cbfc9a2aa5f5ce0609fa358231a9b30b93c1e0072622939"
TOLERANCE = 8
MIN_CONTOUR_EXTENT = 12
UNCHANGED_TABLES = ["GPOS", "GSUB", "GDEF", "name", "OS/2", "post", "cmap", "gasp", "cvt "]


def distance_to_segment_line(point, start, end):
    (x, y), (x1, y1), (x2, y2) = point, start, end
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
    return abs(dy * x - dx * y + x2 * y1 - y2 * x1) / (dx * dx + dy * dy) ** 0.5


def simplify_polyline(points):
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        farthest, index = 0.0, None
        for i in range(first + 1, last):
            distance = distance_to_segment_line(points[i], points[first], points[last])
            if distance > farthest:
                farthest, index = distance, i
        if index is not None and farthest > TOLERANCE:
            keep[index] = True
            stack.extend([(first, index), (index, last)])
    return [point for point, kept in zip(points, keep) if kept]


def simplify_contour(points):
    if len(points) <= 4:
        return points
    # Split the closed ring at the point farthest from its start so both halves are open polylines.
    start = points[0]
    far = max(range(len(points)), key=lambda i: (points[i][0] - start[0]) ** 2 + (points[i][1] - start[1]) ** 2)
    return simplify_polyline(points[: far + 1])[:-1] + simplify_polyline(points[far:] + [start])[:-1]


def simplify_glyph(glyph, glyf):
    coordinates, ends, _ = glyph.getCoordinates(glyf)
    contours, start = [], 0
    for end in ends:
        contour = [tuple(point) for point in coordinates[start : end + 1]]
        start = end + 1
        xs, ys = [p[0] for p in contour], [p[1] for p in contour]
        if max(max(xs) - min(xs), max(ys) - min(ys)) < MIN_CONTOUR_EXTENT:
            continue
        simplified = simplify_contour(contour)
        if len(simplified) >= 3:
            contours.append(simplified)
    points = [point for contour in contours for point in contour]
    glyph.coordinates = GlyphCoordinates(points)
    glyph.endPtsOfContours = [sum(len(c) for c in contours[: i + 1]) - 1 for i in range(len(contours))]
    glyph.flags = bytearray([1] * len(points))  # traced polygons: every point is on-curve
    glyph.numberOfContours = len(contours)
    glyph.program = ttProgram.Program()
    glyph.program.fromBytecode(b"")
    glyph.recalcBounds(glyf)


def main(source, target):
    with open(source, "rb") as handle:
        if hashlib.sha256(handle.read()).hexdigest() != SOURCE_SHA256:
            raise SystemExit("Source is not the original licensed Veneer.")
    font = TTFont(source, recalcTimestamp=False)
    glyf = font["glyf"]
    for name in font.getGlyphOrder():
        glyph = glyf[name]
        if not glyph.isComposite() and glyph.numberOfContours > 0:
            simplify_glyph(glyph, glyf)
    font.flavor = "woff2"
    font.save(target)

    original, simplified = TTFont(source), TTFont(target)
    assert original.getGlyphOrder() == simplified.getGlyphOrder(), "glyph order changed"
    assert original.getBestCmap() == simplified.getBestCmap(), "cmap changed"
    for name in original.getGlyphOrder():
        assert original["hmtx"][name][0] == simplified["hmtx"][name][0], f"advance width changed: {name}"
    for tag in UNCHANGED_TABLES:
        if tag in original.reader:
            assert original.reader[tag] == simplified.reader[tag], f"{tag} changed"
    with open(target, "rb") as handle:
        print(f"{target}: sha256 {hashlib.sha256(handle.read()).hexdigest()}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
