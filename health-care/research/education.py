"""Import the supplied education directory without duplicating telephone numbers."""
import json
from pathlib import Path

def add_education(records, categories, sources):
    payload = json.loads((Path(__file__).parent / 'education.json').read_text(encoding='utf-8'))
    known_categories = {c['id'] for c in categories}
    for c in payload['categories']:
        if c['id'] not in known_categories:
            categories.append(c)
        sources['education-' + c['id']] = {
            'label': 'Подборка «Образование и развитие»', 'url': c['source'],
            'checked': '2026-09-30', 'kind': 'community'
        }
    by_phone = {p: r for r in records for p in r['phones']}
    for item in payload['records']:
        new_phones = []
        for phone in item['phones']:
            if phone not in by_phone:
                new_phones.append(phone)
                continue
            existing = by_phone[phone]
            existing['categories'] = list(dict.fromkeys(existing.get('categories', [existing['category']]) + item['categories']))
            existing['additionalSources'] = list(dict.fromkeys(existing.get('additionalSources', []) + item['sources']))
            # Retain the original record/favorite identity while showing the source's
            # service description in each newly linked folder.
            if existing['id'] != item['id']:
                details = existing.setdefault('categoryDetails', {})
                for cid in item['categories']:
                    details[cid] = {'name': item['name'], 'note': item['note'],
                                    'specialties': next(c['name'] for c in categories if c['id'] == cid)}
        if new_phones:
            record = {k: v for k, v in item.items() if k != 'sources'}
            record['phones'] = new_phones
            record['source'] = item['sources'][0]
            record['additionalSources'] = item['sources'][1:]
            records.append(record)
            for phone in new_phones:
                by_phone[phone] = record
    for i, category in enumerate(categories):
        category['order'] = i
        category['count'] = sum(category['id'] in r.get('categories', [r['category']]) for r in records)

if __name__ == '__main__':
    target = Path(__file__).parent.parent / 'data.json'
    data = json.loads(target.read_text(encoding='utf-8'))
    add_education(data['records'], data['categories'], data['sources'])
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
