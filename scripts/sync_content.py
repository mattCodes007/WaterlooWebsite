#!/usr/bin/env python3
"""Refresh public menu data using only the Python standard library."""
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from menu_editorial import apply_editorial

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://waterloolouisville.com/'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def find(self, tag=None, cls=None):
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get('class', '').split()):
                    result.append(child)
                result.extend(child.find(tag, cls))
        return result

    def text(self):
        return re.sub(r'\s+', ' ', ''.join(c.text() if isinstance(c, Node) else c for c in self.children)).strip()


class Tree(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def fetch(path):
    request = Request(BASE + path, headers={'User-Agent': 'WaterlooWebsite local content sync'})
    with urlopen(request, timeout=30) as response:
        return Tree(response.read().decode()).root


def first_text(node, tag=None, cls=None):
    matches = node.find(tag, cls)
    return matches[0].text() if matches else ''


def menu(path):
    root = fetch(path)
    sections = []
    for section in root.find(cls='food-menu-grid-item-content'):
        items = []
        for item in section.find(cls='food-item-holder'):
            name = first_text(item, 'h3')
            if name:
                items.append({'name': name, 'prices': [p.text() for p in item.find(cls='food-price')], 'description': first_text(item, cls='food-item-description')})
        if items:
            sections.append({'name': first_text(section, 'h2'), 'description': first_text(section, cls='food-menu-description'), 'items': items})
    if not sections:
        raise RuntimeError('No menu sections found; leaving existing content untouched.')
    return sections


def main():
    food_path = 'louisville-the-waterloo-food-menu'
    drinks_path = 'louisville-the-waterloo-drink-menu'
    specials_path = 'louisville-the-waterloo-happy-hours-specials'
    food = menu(food_path)
    photo_path = ROOT / 'photo-menus.json'
    if photo_path.exists():
        # The user's printed menu replaces the old website's drinks and specials.
        photographed = json.loads(photo_path.read_text())
        drinks = []
        specials = [{'name': day['weekday'], 'entries': []} for day in photographed['specials']]
    else:
        drinks = menu(drinks_path)
        specials = []
        for day in fetch(specials_path).find(cls='onespecial'):
            entries = [{'text': first_text(row, cls='col-sm-8'), 'time': first_text(row, cls='col-sm-4')} for row in day.find(cls='row')]
            specials.append({'name': first_text(day, 'h2'), 'entries': entries})
    if len(specials) != 7:
        raise RuntimeError('Expected seven days of specials; leaving existing content untouched.')
    data = apply_editorial({'updatedAt': datetime.now(timezone.utc).isoformat(), 'sources': {'food': BASE + food_path, 'drinks': BASE + drinks_path, 'specials': BASE + specials_path}, 'food': food, 'drinks': drinks, 'specials': specials})
    target = ROOT / 'content.js'
    temporary = target.with_suffix('.tmp')
    temporary.write_text('window.WATERLOO_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
    temporary.replace(target)
    for name, sections in [('Food', data['food']), ('Drinks', data['drinks'])]:
        print(f'{name}: {len(sections)} categories, {sum(len(s["items"]) for s in sections)} items')
    print(f'Specials: {len(specials)} days. Saved {target}')


if __name__ == '__main__':
    main()
