import argparse
import io
import json
import struct
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow is required for texture resizing. Install Pillow or use the bundled runtime that includes it.") from exc


def align4(data: bytearray, pad_byte: bytes = b"\x00") -> None:
    while len(data) % 4:
        data.extend(pad_byte)


def read_glb(path: Path):
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError(f"{path} is not a binary glTF/GLB file")

    version, length = struct.unpack_from("<II", data, 4)
    if version != 2 or length != len(data):
        raise ValueError(f"{path} is not a GLB v2 file")

    offset = 12
    json_chunk = None
    bin_chunk = None
    while offset + 8 <= len(data):
        chunk_length, chunk_type = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == b"JSON":
            json_chunk = json.loads(chunk.rstrip(b" \t\r\n\0").decode("utf-8"))
        elif chunk_type == b"BIN\x00":
            bin_chunk = bytes(chunk)

    if json_chunk is None or bin_chunk is None:
        raise ValueError("Expected JSON and BIN chunks")
    return json_chunk, bin_chunk


def resize_image(payload: bytes, max_size: int, quality: int):
    image = Image.open(io.BytesIO(payload))
    image.load()
    original_size = image.size
    if max(original_size) <= max_size:
        return payload, original_size, original_size, False

    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    save_kwargs = {"optimize": True}
    if image.mode not in ("RGB", "RGBA", "L", "LA"):
        image = image.convert("RGBA")
    if image.format == "JPEG":
        save_kwargs["quality"] = quality
        image.save(output, format="JPEG", **save_kwargs)
    else:
        image.save(output, format="PNG", **save_kwargs)
    return output.getvalue(), original_size, image.size, True


def write_glb(path: Path, gltf: dict, bin_payload: bytes):
    json_payload = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_chunk = bytearray(json_payload)
    align4(json_chunk, b" ")
    bin_chunk = bytearray(bin_payload)
    align4(bin_chunk)

    total_length = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    output = bytearray()
    output.extend(b"glTF")
    output.extend(struct.pack("<II", 2, total_length))
    output.extend(struct.pack("<I4s", len(json_chunk), b"JSON"))
    output.extend(json_chunk)
    output.extend(struct.pack("<I4s", len(bin_chunk), b"BIN\x00"))
    output.extend(bin_chunk)
    path.write_bytes(output)


def main():
    parser = argparse.ArgumentParser(description="Resize embedded PNG/JPEG textures in a GLB copy.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--max-size", type=int, default=1024)
    parser.add_argument("--jpeg-quality", type=int, default=86)
    args = parser.parse_args()

    gltf, original_bin = read_glb(args.input)
    buffer_views = gltf.get("bufferViews", [])
    images = gltf.get("images", [])
    replacement_by_view = {}
    report = []

    for index, image in enumerate(images):
        view_index = image.get("bufferView")
        if view_index is None:
            continue
        view = buffer_views[view_index]
        start = view.get("byteOffset", 0)
        end = start + view["byteLength"]
        payload = original_bin[start:end]
        if image.get("mimeType") not in ("image/png", "image/jpeg"):
            continue

        resized, old_size, new_size, changed = resize_image(payload, args.max_size, args.jpeg_quality)
        replacement_by_view[view_index] = resized
        report.append({
            "image": index,
            "mimeType": image.get("mimeType"),
            "oldPixels": old_size,
            "newPixels": new_size,
            "oldBytes": len(payload),
            "newBytes": len(resized),
            "changed": changed,
        })

    new_bin = bytearray()
    for view_index, view in enumerate(buffer_views):
        if view.get("buffer", 0) != 0:
            continue
        align4(new_bin)
        source_start = view.get("byteOffset", 0)
        source_end = source_start + view["byteLength"]
        payload = replacement_by_view.get(view_index, original_bin[source_start:source_end])
        view["byteOffset"] = len(new_bin)
        view["byteLength"] = len(payload)
        new_bin.extend(payload)

    align4(new_bin)
    gltf.setdefault("buffers", [{}])[0]["byteLength"] = len(new_bin)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    write_glb(args.output, gltf, bytes(new_bin))

    print(json.dumps({
        "input": str(args.input),
        "output": str(args.output),
        "inputBytes": args.input.stat().st_size,
        "outputBytes": args.output.stat().st_size,
        "textures": report,
    }, indent=2))


if __name__ == "__main__":
    main()
