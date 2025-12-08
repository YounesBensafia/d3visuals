#!/usr/bin/env python3
"""
Simple script to extract PassengerId and Age from dataset/titanic-data.csv
and write dataset/titanic_passengerid_age.csv with header `PassengerId,Age`.

Usage:
  python3 scripts/extract_passengerid_age.py

This script preserves empty Age fields as empty strings.
"""
import csv
from pathlib import Path

root = Path(__file__).resolve().parents[1]
input_csv = root / 'data' / 'titanic-data.csv'
output_csv = root / 'data' / 'titanic_passengerid_age.csv'

if not input_csv.exists():
    raise SystemExit(f"Input CSV not found: {input_csv}\nRun this from the repo root or ensure the data file exists.")

with input_csv.open(newline='') as inf, output_csv.open('w', newline='') as outf:
    reader = csv.DictReader(inf)
    writer = csv.writer(outf)
    writer.writerow(['PassengerId', 'Age'])
    for row in reader:
        pid = row.get('PassengerId') or row.get('passengerid') or ''
        age = row.get('Age', '')
        # Keep exactly the same Age string (may be empty or a numeric string)
        writer.writerow([pid, age])

print(f'Wrote: {output_csv} (rows: ~{sum(1 for _ in open(output_csv)) - 1})')
