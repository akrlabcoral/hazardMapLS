import os
import glob
import fitz
import re

pdf_dir = r"C:\Users\KIIT0001\Downloads\New folder (2)"
pdfs = glob.glob(os.path.join(pdf_dir, "*.pdf"))

queries = [
    (r"(?i)(analytic hierarchy process|AHP).{0,50}(weight|table|score)", "AHP Weights"),
    (r"(?i)(I\s*=\s*\d+\.?\d*\s*\*\s*D\s*\^\s*-\d+\.?\d*)", "I-D Threshold Equations"),
    (r"(?i)(probability\s*=\s*|P\(f\)|failure probability)", "Probability Formulas"),
]

output_file = "literature_scan.txt"

with open(output_file, "w", encoding="utf-8") as out:
    for pdf_path in pdfs:
        filename = os.path.basename(pdf_path)
        
        try:
            doc = fitz.open(pdf_path)
            found_anything = False
            file_output = ""
            file_output += f"\n=========================================\n"
            file_output += f"Analyzing {filename}\n"
            file_output += f"=========================================\n"
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                if not text: continue
                
                for regex, label in queries:
                    matches = list(re.finditer(regex, text))
                    if matches:
                        found_anything = True
                        file_output += f"\n--- MATCH: {label} (Page {page_num+1}) ---\n"
                        for match in matches[:3]:
                            start = max(0, match.start() - 100)
                            end = min(len(text), match.end() + 100)
                            snippet = text[start:end].replace('\n', ' ')
                            file_output += f"...{snippet}...\n"
            doc.close()
            
            if found_anything:
                out.write(file_output)
        except Exception as e:
            out.write(f"Error processing {filename}: {e}\n")

print("Done")
