"""Bundle the classroom story, its painted character layers and its scenery into one offline HTML."""
import ast
import base64
import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

WEB = Path(__file__).resolve().parent
SOURCE = WEB.parent
sys.path.insert(0, str(SOURCE))
from cycles import cycle


def constants(filename, names):
    result = {}
    for statement in ast.parse((SOURCE / filename).read_text(encoding="utf-8")).body:
        if isinstance(statement, ast.Assign) and isinstance(statement.targets[0], ast.Name):
            name = statement.targets[0].id
            if name in names:
                result[name.lower()] = ast.literal_eval(statement.value)
    return result


def rear_sheet():
    frames = cycle("rear.png")
    size = frames[0].shape[0]
    sheet = Image.new("RGBA", (size * 6, size * 4))
    for i, frame in enumerate(frames):
        # The film renderer uses premultiplied ink. Browser image decoders expect straight RGBA.
        rgba = frame.copy()
        alpha = np.maximum(1, frame[:, :, 3:4].astype(np.uint16))
        rgba[:, :, :3] = np.minimum(255, (frame[:, :, :3].astype(np.uint16) * 255 + alpha // 2) // alpha)
        sheet.paste(Image.fromarray(rgba), (i % 6 * size, i // 6 * size))
    return sheet


def image_tag(name, image):
    data = io.BytesIO()
    options = dict(quality=94, method=4, exact=True)
    if "icc_profile" in image.info:
        options["icc_profile"] = image.info["icc_profile"]
    image.save(data, format="WEBP", **options)
    encoded = base64.b64encode(data.getvalue()).decode("ascii")
    return f'<img id="art-{name}" alt="" src="data:image/webp;base64,{encoded}">'


def build():
    model = constants("runner.py", {"HEAD", "BODY", "LEFT"})
    model["side"] = constants("side_runner.py", {"PARTS"})["parts"]
    elements = ['<script id="model-outlines" type="application/json">',
                json.dumps(model, separators=(",", ":")), '</script>', '<div hidden aria-hidden="true">']
    for path in sorted((SOURCE / "art").glob("*.png")):
        if path.stem == "rear":
            elements.append(image_tag("rear", rear_sheet()))
        else:
            with Image.open(path) as image:
                elements.append(image_tag(path.stem, image))
    elements.extend(['</div>', '<script>', "'use strict';"])
    for filename in ("motion.js", "story.js", "player.js"):
        elements.append((WEB / filename).read_text(encoding="utf-8"))
    elements.append("</script>")
    template = (WEB / "page.html").read_text(encoding="utf-8")
    output = SOURCE.parent / "runner-live.html"
    staging = output.with_suffix(".build-tmp")
    staging.write_text(template.replace("<!-- SCRIPTS_AND_ART -->", "\n".join(elements)), encoding="utf-8")
    staging.replace(output)
    print(f"{output.name}: {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    build()
