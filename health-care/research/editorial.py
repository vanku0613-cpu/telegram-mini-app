"""Explicit directory changes, reapplied after source imports."""
import json
from pathlib import Path

def apply_editorial(records, categories, sources):
    records = [r for r in records if r['city'] != 'Татарбунары']
    categories = [c for c in categories if c['id'] not in ['96323', '96211']]
    for key in ['web-tatar-family', 'web-tatar-hospital']:
        sources.pop(key, None)
    care = json.loads((Path(__file__).parent / 'care-96211.json').read_text(encoding='utf-8'))
    categories.append(care['category'])
    sources['care-telegram'] = care['source']
    shared = next(r for r in records if '0964353909' in r['phones'])
    shared['categories'] = list(dict.fromkeys(shared.get('categories', [shared['category']]) + ['96211']))
    shared['additionalSources'] = list(dict.fromkeys(shared.get('additionalSources', []) + ['care-telegram']))
    shared['categoryDetails'] = care['shared']
    known = {r['id'] for r in records}
    records.extend(r for r in care['records'] if r['id'] not in known)
    return records, categories
