import csv
import re

# Mapping of London postcode districts to their common area names
area_map = {
    'SW16': 'Streatham',
    'SE27': 'West Norwood',
    'SW2': 'Brixton',
    'SW9': 'Stockwell / Brixton',
    'SW11': 'Battersea',
    'SW4': 'Clapham',
    'SW6': 'Fulham',
    'SW12': 'Balham',
    'SE1': 'Southwark / Waterloo',
    'W1F': 'Soho',
    'W2': 'Paddington',
    'SW15': 'Putney',
    'NW1': 'Camden',
    'SW8': 'Vauxhall',
    'SE22': 'East Dulwich',
    'W11': 'Notting Hill',
    'N1': 'Islington',
    'SW7': 'South Kensington',
    'SW3': 'Chelsea',
    'W12': "Shepherd's Bush",
    'SW18': 'Wandsworth',
    'SE5': 'Camberwell',
    'SE21': 'Dulwich',
    'SE15': 'Peckham',
    'WC2H': 'Covent Garden',
    'NW6': 'Kilburn',
    'SW1V': 'Pimlico',
    'NW3': 'Hampstead',
    'W6': 'Hammersmith',
    'W8': 'Kensington',
    'W1T': 'Fitzrovia',
    'SW10': 'West Brompton / Chelsea',
    'SW17': 'Tooting',
    'N19': 'Archway / Highgate',
    'W2': 'Paddington',
    'SW14': 'Mortlake / East Sheen',
    'SE24': 'Herne Hill',
    'SE11': 'Kennington',
    'SE17': 'Walworth / Kennington',
    'E1': 'Aldgate / Whitechapel',
    'E2': 'Bethnal Green',
    'E8': 'Hackney',
    'E9': 'Homerton',
    'N16': 'Stoke Newington',
    'NW5': 'Kentish Town',
    'SE16': 'Walworth',
    'SE19': 'Crystal Palace',
    'SE20': 'Anerley',
    'SE23': 'Forest Hill',
    'SE26': 'Sydenham',
    'SW13': 'Barnes',
    'SW19': 'Wimbledon',
    'SW20': 'Raynes Park',
    'W1': 'West End',
    'W1B': 'Soho',
    'W1C': 'Oxford Street',
    'W1D': 'Soho',
    'W1G': 'Soho',
    'W1H': 'Marylebone',
    'W1J': 'Marylebone',
    'W1K': 'Mayfair',
    'W1S': 'Mayfair',
    'W1U': 'Marylebone',
    'W1W': 'Marylebone',
    'W3': 'Acton',
    'W4': 'Chiswick',
    'W5': 'Chiswick',
    'W7': 'Hanwell',
    'W9': 'Maida Vale',
    'W10': 'Maida Hill',
    'W14': 'West Kensington',
    'WC1': 'Bloomsbury',
    'WC2': 'Covent Garden',
    'EC1': 'Clerkenwell',
    'EC2': 'Bishopsgate',
    'EC3': 'Fenchurch Street',
    'EC4': 'Monument',
}

rows = []
with open('tmp/outscraper/business_emails_mapped.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        rows.append(row)

for row in rows:
    postcode = row.get('postcode', '').strip().upper()
    
    # Extract the outcode (the part before the space, or the first 2-4 characters)
    # e.g. "SW16 5SH" -> "SW16", "W1F 8HL" -> "W1F"
    match = re.match(r'^([A-Z]{1,2}[0-9][A-Z0-9]?)\s*[0-9][A-Z]{2}$', postcode)
    if match:
        outcode = match.group(1)
    else:
        # Fallback if no space or malformed
        outcode = postcode.split(' ')[0] if ' ' in postcode else postcode[:4].strip()
    
    # Try to find the area
    area = area_map.get(outcode)
    
    if not area:
        # Try without the last letter for central London (e.g. W1F -> W1)
        if outcode.startswith('W1') or outcode.startswith('WC') or outcode.startswith('EC') or outcode.startswith('SW1'):
            area = area_map.get(outcode[:2]) or area_map.get(outcode[:3])
            
    if area:
        row['city'] = area
    else:
        # If we can't map it, but it looks like a London postcode, just put London
        if re.match(r'^[A-Z]{1,2}[0-9]', outcode):
            row['city'] = 'London (' + outcode + ')'
        else:
            row['city'] = 'London'

with open('tmp/outscraper/business_emails_mapped.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print("Updated locations!")
