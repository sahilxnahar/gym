from pathlib import Path
import sys
import xml.etree.ElementTree as ET

BUILD = Path('mobile/android/app/build/intermediates')
ANDROID = '{http://schemas.android.com/apk/res/android}'
EXPECTED = {'android.permission.INTERNET', 'android.permission.health.READ_STEPS'}

candidates = [path for path in BUILD.rglob('AndroidManifest.xml') if 'merged_manifest' in str(path) or 'merged_manifests' in str(path)] if BUILD.exists() else []
if not candidates:
    sys.exit('No merged AndroidManifest.xml found after the debug build.')

def rank(path):
    text = str(path)
    return (('processDebugManifest' in text), ('/debug/' in text), path.stat().st_mtime)

manifest_path = max(candidates, key=rank)
root = ET.parse(manifest_path).getroot()
permissions = set()
for node in root:
    if node.tag.endswith('uses-permission') or node.tag.startswith('uses-permission-sdk'):
        name = node.attrib.get(f'{ANDROID}name')
        if name:
            permissions.add(name)
print(f'Auditing merged debug permissions: {manifest_path}')
print('Declared:', ', '.join(sorted(permissions)))
if permissions != EXPECTED:
    sys.exit(f'Expected only {sorted(EXPECTED)}, found {sorted(permissions)}')
print('Merged manifest grants only Internet and read-only Health Connect STEPS.')
