"""
Generative Ceramic Vase — Segmented Design — GhPython Script
==============================================================
Paste this into a GhPython component in Grasshopper (Rhino 8).

INPUTS (create these on the GhPython component):
  - segment_count  : int    (3-7, default 5)
  - has_cap        : bool   (default True)
  - contour_types  : str    ("flower,sun,rect,sun,flower" — comma-separated per segment)
  - widths         : str    ("50,55,60,55,50" — comma-separated radii in mm)
  - mouth_width    : float  (15-75, default 25) — cap mouth radius in mm
  - segments_around: int    (36-120, default 72) — circumference resolution

OUTPUTS:
  - vase_mesh   : Mesh   — the generated vase mesh
  - info        : str    — summary of parameters

Compatible with: Rhino 8, Grasshopper, GhPython
Printer: Tronxy Moore 2 Pro (255x255x260mm build volume)
"""

import Rhino.Geometry as rg
import math

# ─── CONSTANTS ───

SEGMENT_HEIGHT = 30.0   # mm per segment
CAP_HEIGHT = 60.0       # mm
LAYERS_PER_SEG = 10     # mesh layers per segment
CAP_LAYERS = 20         # mesh layers for cap
MAX_WIDTH_DIFF = 15.0   # mm max between adjacent segments
MIN_WIDTH = 35.0
MAX_WIDTH = 80.0
MIN_MOUTH = 15.0

MAX_BUILD_XY = 255.0
MAX_BUILD_Z = 260.0

# ─── PARSE INPUTS ───

try: segment_count = int(segment_count)
except: segment_count = 5
segment_count = max(3, min(7, segment_count))

try: has_cap = bool(has_cap)
except: has_cap = True

if has_cap:
    segment_count = min(segment_count, 5)

try:
    contour_list = [s.strip().lower() for s in contour_types.split(",")]
except:
    contour_list = ["flower"] * segment_count

# Pad or trim contour list to match segment count
while len(contour_list) < segment_count:
    contour_list.append("flower")
contour_list = contour_list[:segment_count]

# Validate contour types
valid_types = {"flower", "sun", "rect"}
contour_list = [c if c in valid_types else "flower" for c in contour_list]

try:
    width_list = [float(s.strip()) for s in widths.split(",")]
except:
    width_list = [50.0] * segment_count

while len(width_list) < segment_count:
    width_list.append(50.0)
width_list = width_list[:segment_count]

# Clamp widths
width_list = [max(MIN_WIDTH, min(MAX_WIDTH, w)) for w in width_list]

# Enforce width constraints
for i in range(1, len(width_list)):
    width_list[i] = max(width_list[i], width_list[i-1] - MAX_WIDTH_DIFF)
    width_list[i] = min(width_list[i], width_list[i-1] + MAX_WIDTH_DIFF)

try: mouth_width = float(mouth_width)
except: mouth_width = 25.0
if has_cap:
    mouth_width = max(MIN_MOUTH, min(mouth_width, width_list[-1] - 5))

try: segments_around = int(segments_around)
except: segments_around = 72
segments_around = max(36, min(120, segments_around))

# ─── CONTOUR FUNCTIONS ───

def flower_contour(theta):
    lobes = 6
    depth = 0.18
    return 1.0 - depth + depth * abs(math.cos(lobes * theta / 2.0))

def sun_contour(theta):
    spikes = 8
    depth = 0.20
    phase = ((theta * spikes / (2.0 * math.pi)) % 1.0 + 1.0) % 1.0
    triangle = 1.0 - 2.0 * abs(phase - 0.5)
    return 1.0 - depth + depth * triangle

def rect_contour(theta):
    n = 4.0
    rot = theta + math.pi / 4.0
    c = abs(math.cos(rot))
    s = abs(math.sin(rot))
    r = 1.0 / math.pow(math.pow(c, n) + math.pow(s, n), 1.0 / n)
    return r

contour_fn = {
    "flower": flower_contour,
    "sun": sun_contour,
    "rect": rect_contour
}

# ─── GEOMETRY HELPERS ───

def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)

def lerp(a, b, t):
    return a + (b - a) * t

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def get_segment_radius(theta, seg_index, local_t):
    this_contour = contour_fn[contour_list[seg_index]]
    this_width = width_list[seg_index]

    # Width interpolation
    prev_width = width_list[seg_index - 1] if seg_index > 0 else this_width
    next_width = width_list[seg_index + 1] if seg_index < len(width_list) - 1 else this_width

    if local_t < 0.5:
        t = local_t * 2.0
        edge_width = (prev_width + this_width) / 2.0
        w = lerp(edge_width, this_width, smoothstep(t))
    else:
        t = (local_t - 0.5) * 2.0
        edge_width = (this_width + next_width) / 2.0
        w = lerp(this_width, edge_width, smoothstep(t))

    # Shape blending at boundaries
    blend_zone = 0.2
    if local_t < blend_zone and seg_index > 0:
        below_contour = contour_fn[contour_list[seg_index - 1]]
        blend_t = smoothstep(local_t / blend_zone)
        shape = lerp(below_contour(theta), this_contour(theta), blend_t)
    elif local_t > (1.0 - blend_zone) and seg_index < len(contour_list) - 1:
        above_contour = contour_fn[contour_list[seg_index + 1]]
        blend_t = smoothstep((local_t - (1.0 - blend_zone)) / blend_zone)
        shape = lerp(this_contour(theta), above_contour(theta), blend_t)
    else:
        shape = this_contour(theta)

    # Bottom taper: circle → contour
    if seg_index == 0 and local_t < 0.15:
        shape = lerp(1.0, shape, smoothstep(local_t / 0.15))

    return shape * w

def get_cap_radius(theta, local_t):
    last_contour = contour_fn[contour_list[-1]]
    last_width = width_list[-1]

    shape_blend = smoothstep(clamp(local_t / 0.6, 0.0, 1.0))
    shape = lerp(last_contour(theta), 1.0, shape_blend)

    w = lerp(last_width, mouth_width, smoothstep(local_t))

    return shape * w

# ─── BUILD MESH ───

mesh = rg.Mesh()
ring_count = 0

# Body segments
for seg in range(segment_count):
    start_layer = 0 if seg == 0 else 1
    for layer in range(start_layer, LAYERS_PER_SEG + 1):
        local_t = float(layer) / LAYERS_PER_SEG
        z = seg * SEGMENT_HEIGHT + local_t * SEGMENT_HEIGHT

        for a in range(segments_around):
            theta = 2.0 * math.pi * a / segments_around
            r = get_segment_radius(theta, seg, local_t)
            x = r * math.cos(theta)
            y = r * math.sin(theta)
            mesh.Vertices.Add(rg.Point3d(x, y, z))

        ring_count += 1

# Cap
if has_cap:
    cap_base = segment_count * SEGMENT_HEIGHT
    for layer in range(1, CAP_LAYERS + 1):
        local_t = float(layer) / CAP_LAYERS
        z = cap_base + local_t * CAP_HEIGHT

        for a in range(segments_around):
            theta = 2.0 * math.pi * a / segments_around
            r = get_cap_radius(theta, local_t)
            x = r * math.cos(theta)
            y = r * math.sin(theta)
            mesh.Vertices.Add(rg.Point3d(x, y, z))

        ring_count += 1

# Faces (quad strips)
for i in range(ring_count - 1):
    for j in range(segments_around):
        curr = i * segments_around + j
        curr_next = i * segments_around + (j + 1) % segments_around
        above = (i + 1) * segments_around + j
        above_next = (i + 1) * segments_around + (j + 1) % segments_around
        mesh.Faces.AddFace(curr, curr_next, above_next, above)

# Bottom cap
center_bottom = mesh.Vertices.Count
mesh.Vertices.Add(rg.Point3d(0, 0, 0))
for j in range(segments_around):
    j_next = (j + 1) % segments_around
    mesh.Faces.AddFace(center_bottom, j_next, j)

# Finalize
mesh.Normals.ComputeNormals()
mesh.Compact()

vase_mesh = mesh

# ─── OUTPUT INFO ───

total_height = segment_count * SEGMENT_HEIGHT + (CAP_HEIGHT if has_cap else 0)
max_width = max(width_list) * 2

info = """Segmented Vase Parameters:
  Segments:     {} x {}mm
  Cap:          {} ({}mm mouth)
  Total height: {}mm
  Max width:    {}mm (diameter)
  Contours:     {}
  Widths:       {} mm
  Resolution:   {} around
  Vertices:     {}
  Faces:        {}
  Fits printer: {}""".format(
    segment_count, int(SEGMENT_HEIGHT),
    "ON" if has_cap else "OFF", int(mouth_width) if has_cap else "-",
    int(total_height),
    int(max_width),
    ", ".join(contour_list),
    ", ".join([str(int(w)) for w in width_list]),
    segments_around,
    mesh.Vertices.Count, mesh.Faces.Count,
    "YES" if (max_width <= MAX_BUILD_XY and total_height <= MAX_BUILD_Z) else "NO"
)

print(info)
