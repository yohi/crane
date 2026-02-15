from PIL import Image
import os

def generate_icons():
    source_path = 'build/icon.png'
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found.")
        return

    img = Image.open(source_path)

    # Generate ICO
    # Windows icons should include 16, 32, 48, 64, 128, 256 sizes
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save('build/icon.ico', format='ICO', sizes=icon_sizes)
    print("Generated build/icon.ico")

    # Generate ICNS
    # Pillow supports saving ICNS.
    try:
        img.save('build/icon.icns', format='ICNS')
        print("Generated build/icon.icns")
    except Exception as e:
        print(f"Failed to generate ICNS: {e}")
        # If Pillow fails, we might just rely on png or try another way.
        # But let's see.

if __name__ == "__main__":
    generate_icons()
