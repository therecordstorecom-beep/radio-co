# Grasshopper Setup Guide — Generative Ceramic Vase

## Step 1: Open Grasshopper in Rhino 8

1. Open **Rhino 8**
2. Type `Grasshopper` in the command line and press Enter

## Step 2: Create the Vase Generator

1. **Add a GhPython component**: double-click the canvas → search "GhPython Script"
2. **Right-click** the component → "Edit Script" or double-click to open the editor
3. **Copy-paste** the entire contents of `generative_vase.py` into the editor
4. Click **OK** / close the editor

### Add Input Sliders

Right-click each input on the GhPython component and create these inputs:

| Input Name    | Type  | Min  | Max  | Default | Description                    |
|---------------|-------|------|------|---------|--------------------------------|
| height        | float | 80   | 260  | 150     | Vase height (mm)               |
| base_radius   | float | 20   | 80   | 40      | Bottom radius (mm)             |
| mid_radius    | float | 20   | 100  | 60      | Middle bulge radius (mm)       |
| top_radius    | float | 15   | 80   | 35      | Top opening radius (mm)        |
| mid_position  | float | 0.2  | 0.8  | 0.45    | Bulge position (0-1)           |
| wave_count    | int   | 0    | 12   | 5       | Number of wave bumps           |
| wave_amp      | float | 0    | 15   | 4       | Wave amplitude (mm)            |
| twist_angle   | float | 0    | 180  | 30      | Twist degrees                  |
| wall_thick    | float | 2    | 6    | 3       | Wall thickness (mm)            |
| segments      | int   | 36   | 120  | 72      | Circumference resolution       |
| seed          | int   | 0    | 9999 | 42      | Random seed for uniqueness     |

### Add Output

The component has 3 outputs:
- **vase_mesh** — connect to a Mesh preview or the STL exporter
- **profile_crv** — the profile curve (optional visualization)
- **info** — text summary

### How to set up inputs:

1. Zoom in on the GhPython component
2. Use the "+" button on the left side to add 11 inputs
3. Right-click each input → Rename to match the table above
4. For each input, add a **Number Slider** (double-click canvas → type the default value)
5. Connect each slider to the matching input

## Step 3: Create the STL Exporter

1. Add another **GhPython Script** component
2. Paste contents of `export_stl.py`
3. Connect the **vase_mesh** output → **mesh** input of this component
4. Add a **Boolean Toggle** → connect to the **export** input
5. (Optional) Add a **Panel** with a filename → connect to **filename** input
6. STL files will export to `Desktop/MYO_VASE/exports/`

## Step 4: Preview & Play

- Drag sliders to change the vase shape in real-time
- The mesh updates live in the Rhino viewport
- Toggle the Boolean to export STL when you like a shape
- Change the **seed** slider to get completely different variations

## Printer Notes (Tronxy Moore 2 Pro)

- Build volume: 255 x 255 x 260 mm
- Nozzle: 1-3 mm diameter
- The script automatically clamps geometry to fit the build volume
- Wall thickness default (3mm) works well with 1.5-2mm nozzle
- Recommended layer height for ceramics: 0.8-1.5mm
