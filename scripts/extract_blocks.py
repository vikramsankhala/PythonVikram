"""Extract block metadata from docx_extracted.txt into JSON."""
import json
import re
import os

def main():
    base = os.path.join(os.path.dirname(__file__), '..')
    docx_path = os.path.join(base, '..', 'docx_extracted.txt')
    if not os.path.exists(docx_path):
        docx_path = os.path.join(base, 'docx_extracted.txt')
    with open(docx_path, 'r', encoding='utf-8') as f:
        lines = [l.rstrip() for l in f.readlines()]

    blocks = []
    i = 0
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    
    while i < len(lines):
        # Look for "Block N"
        m = re.match(r'^Block (\d+)$', lines[i])
        if m:
            bid = int(m.group(1))
            i += 1
            day = lines[i] if i < len(lines) and lines[i] in days else 'Monday'
            i += 1
            title = lines[i] if i < len(lines) else ''
            i += 1
            
            obj, concepts, exercise, homework = '', [], '', ''
            while i < len(lines):
                if lines[i] == 'Objective':
                    i += 1
                    obj = lines[i] if i < len(lines) else ''
                    i += 1
                elif lines[i] == 'Concepts':
                    i += 1
                    while i < len(lines) and lines[i].startswith('•'):
                        concepts.append(lines[i].lstrip('• '))
                        i += 1
                elif lines[i] == 'Exercise':
                    i += 1
                    ex_parts = []
                    while i < len(lines) and (lines[i].startswith('→') or lines[i].strip() == '' or not lines[i] in ['Homework', 'Concepts', 'Objective']):
                        if lines[i].startswith('→'):
                            ex_parts.append(lines[i].lstrip('→ '))
                        i += 1
                        if i < len(lines) and lines[i] in ['Homework', 'Block', 'WEEK']:
                            break
                    exercise = ' '.join(ex_parts) if ex_parts else ''
                elif lines[i] == 'Homework':
                    i += 1
                    hw_parts = []
                    while i < len(lines) and not (lines[i].startswith('Block ') or lines[i].startswith('WEEK ')):
                        if lines[i].strip():
                            hw_parts.append(lines[i])
                        i += 1
                    homework = ' '.join(hw_parts) if hw_parts else ''
                    break
                else:
                    i += 1
            
            week = (bid - 1) // 10 + 1
            blocks.append({
                'id': bid,
                'week': week,
                'day': day,
                'title': title,
                'objective': obj,
                'concepts': concepts,
                'exercise': exercise,
                'homework': homework
            })
        else:
            i += 1

    with open('content/blocks-metadata.json', 'w', encoding='utf-8') as f:
        json.dump(blocks, f, indent=2, ensure_ascii=False)
    print(f'Extracted {len(blocks)} blocks')

if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(__file__), '..'))
    main()
