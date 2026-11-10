"""Apply the restaurant's approved copy, menu organization, and photo choices."""
import copy
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def mark_chips(text):
    # Scope the label to the chips, rather than making a claim about the dish.
    return re.sub(r'\bchips\b(?!\s*\(gf\))', lambda m: m.group() + ' (gf)', text, flags=re.I)


def apply_editorial(source):
    data = copy.deepcopy(source)
    edits = json.loads((ROOT / 'menu-edits.json').read_text())
    for kind in ('food', 'drinks'):
        for section in data[kind]:
            for item in section['items']:
                item.update(edits[kind].get(item['name'], {}))
                item['name'] = mark_chips(item['name'])
                item['description'] = mark_chips(item['description'])

    taco_bowl = next((copy.deepcopy(item) for group in data['food'] if group['name'] == 'Tacos' for item in group['items'] if item['name'] == 'Taco Bowl'), None)
    food = []
    for section in data['food']:
        name = section['name']
        if name == 'Soup - Salad':
            soup_names = {'Tomato Bisque', 'Roasted Pork Green Chile', 'Brisket Soup', 'Soup of the Day'}
            food.append({'name': 'Soups', 'description': 'Choose a cup or a bowl.', 'items': [item for item in section['items'] if item['name'] in soup_names]})
            food.append({
                'name': 'Salads', 'description': '',
                'saladOptions': {
                    'dressings': ['Blue cheese', 'Ranch', 'Chipotle ranch', 'Thousand Island', 'Caesar', 'House vinaigrette', 'Blueberry vinaigrette'],
                    'description': 'All dressings are gluten-free.',
                    'proteins': [
                        {'name': 'Grilled chicken breast, seasoned ground beef, pulled pork, or tofu', 'price': '+$7'},
                        {'name': 'Crispy cod', 'price': '+$8'},
                        {'name': 'Grilled salmon*, steak*, or house-smoked brisket', 'price': '+$12'}
                    ],
                    'extras': [{'name': 'Avocado', 'price': '+$3'}]
                },
                'items': [item for item in section['items'] if item['name'] not in soup_names]
            })
            continue
        if name == 'Burgers - Sandwiches':
            section['name'] = 'Burgers & Sandwiches'
            section['description'] = 'All burgers are cooked to medium. Substitute sweet potato fries, onion rings, or a side salad +$2; mac & cheese +$4. Substitute grilled chicken, a Beyond Burger, or bison +$2. A gluten-free bun is available for all burgers and most sandwiches +$3.'
            section['items'] = [item for item in section['items'] if item['name'] not in {'Palisade', 'Cheeses', 'Toppings'}]
            section['customization'] = {
                'title': 'Make it yours',
                'cheeses': ['Cheddar', 'Smoked Gouda', 'Gorgonzola', 'American', 'Goat cheese', 'Swiss', 'Pepper jack'],
                'toppings': [
                    {'name': 'Sautéed onions, sautéed mushrooms, jalapeños, fried egg*, or peanut butter', 'price': '+$1'},
                    {'name': 'Bacon or avocado', 'price': '+$3'},
                    {'name': 'House-smoked brisket', 'price': '+$12'}
                ]
            }
        elif name == 'Sides':
            section['layout'] = 'compact'
        elif name == 'Tacos':
            section['description'] = 'Three tacos per serving at the listed price. Corn tortillas are standard, with flour tortillas available. Gringo tacos come on flour tortillas, with corn tortillas available. Taco bowls are served without tortillas.'
            section['items'] = [item for item in section['items'] if item['name'] != 'Taco Bowl']
            # A bowl is a different serving, so keep it with the other plates and bowls.
        elif name == 'Plates - Bowls':
            section['name'] = 'Plates & Bowls'
            section['items'] = [item for item in section['items'] if item['name'] != 'Pork Chop']
            if taco_bowl:
                section['items'].append(taco_bowl)
        elif name == 'Younger Guests':
            section['name'] = 'Kids & Golden-Aged Guests'
            section['description'] = 'Smaller portions for kids 12 and under and golden-aged guests (seniors).'
            divider = next((index for index, item in enumerate(section['items']) if item['name'] == 'SIDES:'), len(section['items']))
            section['sideOptions'] = section['items'][divider + 1:]
            section['items'] = section['items'][:divider]
        elif name == 'Happy Hour':
            section['description'] = 'Every day, 3–6 PM. Dine-in only.'
            section['items'] = [dict(item, description='Choose corn or flour tortillas. The Gringo comes on flour tortillas by default.' if item['name'] == 'À La Carte Taco' else item['description']) for item in section['items']]
            data['happyHour'] = section
            continue
        food.append(section)
    data['food'] = food

    for section in data['drinks']:
        section['name'] = {'Red': 'Red Wine', 'White': 'White Wine', 'Rose & Bubbles': 'Rosé & Bubbles', 'Drafts': 'Draft Beer', 'Scotch & Irish': 'Scotch & Irish Whiskey', 'Japan & Asia': 'Japanese & Asian Whisky'}.get(section['name'], section['name'])
        if section['name'] == 'Seasonal Cocktails':
            section['description'] = ''
        if section['name'] in {'Red Wine', 'White Wine', 'Rosé & Bubbles'}:
            section['description'] = 'Where two prices are listed, they are for a glass and a bottle, respectively.'

    data['happyHour']['dailyOffers'] = [{'day': day, 'text': '$5 house margaritas during happy hour.'} for day in ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']]
    data['happyHour']['dailyOffers'].append({'day': 'Saturday', 'text': '$5 house margaritas all day.'})
    for day in data['specials']:
        weekday = day['name'].split()[0]
        day['weekday'] = weekday
        day['name'] = re.sub(r'(\d+)(?:st|nd|rd|th)\b', r'\1', day['name'])
        day['name'] = day['name'].replace(weekday + ' ', weekday + ', ', 1)
        entries = []
        for entry in day['entries']:
            text = entry['text']
            if 'pork chop' in text.lower():
                continue
            if text.lower().startswith('happy hour'):
                continue
            entry['text'] = mark_chips(edits['specials'].get(text, text))
            entry.pop('time', None)
            entries.append(entry)
        day['entries'] = entries
    photo_path = ROOT / 'photo-menus.json'
    if photo_path.exists():
        photographed = json.loads(photo_path.read_text())
        for key in ('drinks', 'happyHour', 'specials'):
            data[key] = copy.deepcopy(photographed[key])
        data['photoMenuDate'] = photographed['sourceDate']
        data['sources']['drinks'] = photographed['source']
        data['sources']['specials'] = photographed['source']
    return data
