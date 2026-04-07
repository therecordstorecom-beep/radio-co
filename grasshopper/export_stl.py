"""
STL Export — GhPython Script
==============================
Paste this into a SECOND GhPython component in Grasshopper.
Connect the vase_mesh output from the vase generator to this component.

INPUTS:
  - mesh        : Mesh    — the vase mesh to export
  - export      : bool    — toggle True to export (use a Boolean Toggle)
  - filename    : str     — optional filename (default: "vase_<seed>.stl")
  - folder      : str     — export folder path (default: Desktop/MYO_VASE/exports)

OUTPUTS:
  - status      : str     — export result message
"""

import Rhino.Geometry as rg
import os
import time

# Defaults
try:
    if not folder:
        folder = os.path.expanduser("~/Desktop/MYO_VASE/exports")
except:
    folder = os.path.expanduser("~/Desktop/MYO_VASE/exports")

try:
    if not filename:
        filename = "vase_{}.stl".format(int(time.time()))
except:
    filename = "vase_{}.stl".format(int(time.time()))

if not filename.lower().endswith(".stl"):
    filename += ".stl"

status = "Ready. Set 'export' to True to save STL."

if export and mesh:
    # Ensure folder exists
    if not os.path.exists(folder):
        os.makedirs(folder)

    filepath = os.path.join(folder, filename)

    # Write binary STL
    try:
        import struct

        triangles = []
        for i in range(mesh.Faces.Count):
            face = mesh.Faces[i]
            vA = mesh.Vertices[face.A]
            vB = mesh.Vertices[face.B]
            vC = mesh.Vertices[face.C]

            # Compute normal
            edge1 = rg.Vector3d(vB.X - vA.X, vB.Y - vA.Y, vB.Z - vA.Z)
            edge2 = rg.Vector3d(vC.X - vA.X, vC.Y - vA.Y, vC.Z - vA.Z)
            normal = rg.Vector3d.CrossProduct(edge1, edge2)
            normal.Unitize()

            triangles.append((normal, vA, vB, vC))

            # If quad, add second triangle
            if face.IsQuad:
                vD = mesh.Vertices[face.D]
                edge1 = rg.Vector3d(vC.X - vA.X, vC.Y - vA.Y, vC.Z - vA.Z)
                edge2 = rg.Vector3d(vD.X - vA.X, vD.Y - vA.Y, vD.Z - vA.Z)
                normal = rg.Vector3d.CrossProduct(edge1, edge2)
                normal.Unitize()
                triangles.append((normal, vA, vC, vD))

        with open(filepath, 'wb') as f:
            # Header (80 bytes)
            f.write(b'\0' * 80)
            # Triangle count
            f.write(struct.pack('<I', len(triangles)))
            # Triangles
            for normal, v1, v2, v3 in triangles:
                f.write(struct.pack('<fff', normal.X, normal.Y, normal.Z))
                f.write(struct.pack('<fff', v1.X, v1.Y, v1.Z))
                f.write(struct.pack('<fff', v2.X, v2.Y, v2.Z))
                f.write(struct.pack('<fff', v3.X, v3.Y, v3.Z))
                f.write(struct.pack('<H', 0))  # attribute byte count

        status = "Exported: {} ({} triangles)".format(filepath, len(triangles))
    except Exception as e:
        status = "ERROR: {}".format(str(e))
else:
    if not mesh:
        status = "No mesh connected!"

print(status)
