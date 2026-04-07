# Rhino.Compute Setup — Connecting Website to Grasshopper

## What is Rhino.Compute?

Rhino.Compute is a REST API server built into Rhino 8 that lets you run Grasshopper definitions remotely. This means:

**Website (sliders) → HTTP request → Rhino.Compute → Grasshopper → STL → back to browser**

## Step 1: Enable Rhino.Compute (Already in Rhino 8)

1. Open **Rhino 8**
2. Type `Rhino.Compute` in the command line — this starts the local server
3. By default it runs on `http://localhost:6500`

Alternatively, run from command line:
```
"C:\Program Files\Rhino 8\System\compute.rhino3d.exe"
```

## Step 2: Create the Grasshopper Definition (.gh file)

1. Open Grasshopper
2. Set up the vase generator using `generative_vase.py` (see SETUP_GUIDE.md)
3. **Important**: Name the input parameters exactly as they appear in the script
4. Save the definition as `generative_vase.gh` in the `grasshopper/` folder

## Step 3: Test the API

Once Rhino.Compute is running, test with curl:

```bash
curl -X POST http://localhost:6500/grasshopper \
  -H "Content-Type: application/json" \
  -d '{
    "pointer": "grasshopper/generative_vase.gh",
    "values": [
      {"ParamName": "height", "InnerTree": {"0": [{"type": "System.Double", "data": 150}]}},
      {"ParamName": "base_radius", "InnerTree": {"0": [{"type": "System.Double", "data": 40}]}},
      {"ParamName": "mid_radius", "InnerTree": {"0": [{"type": "System.Double", "data": 60}]}},
      {"ParamName": "top_radius", "InnerTree": {"0": [{"type": "System.Double", "data": 35}]}},
      {"ParamName": "wave_count", "InnerTree": {"0": [{"type": "System.Int32", "data": 5}]}},
      {"ParamName": "wave_amp", "InnerTree": {"0": [{"type": "System.Double", "data": 4}]}},
      {"ParamName": "twist_angle", "InnerTree": {"0": [{"type": "System.Double", "data": 30}]}},
      {"ParamName": "seed", "InnerTree": {"0": [{"type": "System.Int32", "data": 42}]}}
    ]
  }'
```

## Step 4: Connect Website (Future Enhancement)

The current website uses a JavaScript Three.js preview that mirrors the Grasshopper logic.

For production use, you would:
1. Run Rhino.Compute on a server (or locally)
2. Add a "Generate STL" button on the website that sends parameters to Rhino.Compute
3. Rhino.Compute runs the actual Grasshopper definition and returns a mesh/STL
4. The website downloads the production-ready STL

**For now**: The website preview + Grasshopper sliders workflow is sufficient:
- Use the website to explore shapes visually
- Note the parameters you like
- Set the same values in Grasshopper
- Export production STL from Grasshopper

## Network Notes

- Rhino.Compute runs locally — no internet required for generation
- For remote access, you'd need to expose the port (or use a tunnel like ngrok)
- Rhino 8 license must be active on the compute machine
