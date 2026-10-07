from pathlib import Path
import base64,json,re,zipfile
root=Path(__file__).resolve().parents[1]; public=root/'public'; out=root.parent
html=(public/'index.html').read_text()
html=re.sub(r'<link[^>]+(?:manifest|apple-touch-icon|rel="icon")[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="/styles.css">','<style>'+(public/'styles.css').read_text()+'</style>')
media={p.name:'data:image/'+('gif' if p.suffix=='.gif' else 'png')+';base64,'+base64.b64encode(p.read_bytes()).decode() for p in (public/'demos').iterdir() if p.suffix in ['.gif','.png']}
for name in ['exercise-library','training','app']:
 s=(public/(name+'.js')).read_text()
 if name=='app':
  s=s.replace('navigator.serviceWorker.register(\'/sw.js\')','Promise.reject(new Error("Standalone preview"))')
  s=s.replace('src="/demos/${key}.${paused?\'png\':\'gif\'}"','src="${previewMedia[key+\'.\'+(paused?\'png\':\'gif\')]}"')
  s=s.replace("`/demos/${key}.${paused?'png':'gif'}`","previewMedia[key+'.'+(paused?'png':'gif')]")
  s='const previewMedia='+json.dumps(media)+';\n'+s
  s=s.replace("const KEY='forge-state-v1'","const KEY='forge-preview-v2'")
 s=s.replace('</script','<\\/script')
 html=html.replace(f'<script src="/{name}.js" defer></script>','<script>'+s+'</script>')
(out/'forge-preview.html').write_text(html)
with zipfile.ZipFile(out/'forge-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in root.rglob('*'):
  if p.is_file() and not any(part in ['.git','data','node_modules','__pycache__'] for part in p.relative_to(root).parts) and p.name!='.env':z.write(p,Path('forge')/p.relative_to(root))
print('Standalone preview and source archive built.')
