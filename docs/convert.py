import markdown
import codecs

md_text = codecs.open('HazardMap_Viva_Handbook_Complete.md', 'r', 'utf-8').read()
html = markdown.markdown(md_text, extensions=['fenced_code', 'tables'])

css = """
body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; padding: 40px; max-width: 900px; margin: auto; color: #333; }
h1, h2, h3 { color: #2c3e50; margin-top: 1.5em; }
h1 { border-bottom: 2px solid #3498db; padding-bottom: 10px; }
h2 { border-bottom: 1px solid #eee; padding-bottom: 5px; }
code { background: #f4f4f4; padding: 2px 4px; border-radius: 4px; font-family: Consolas, monospace; }
pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
table { border-collapse: collapse; width: 100%; margin: 20px 0; }
th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
th { background-color: #f8f9fa; }
p { margin-bottom: 15px; }
strong { color: #2c3e50; }
"""

final_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Hazard Map Viva Handbook</title>
<style>{css}</style>
</head>
<body>
{html}
<script>
  window.onload = function() {{ window.print(); }}
</script>
</body>
</html>'''

codecs.open('HazardMap_Viva_Handbook.html', 'w', 'utf-8').write(final_html)
print("HTML generated successfully.")
