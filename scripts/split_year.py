import pandas as pd
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
data_dir = os.path.join(project_root, 'data')

input_file = os.path.join(data_dir, 'coffee_analysis.csv')
output_file = os.path.join(data_dir, 'coffee_analysis.csv')

df = pd.read_csv(input_file)

df['review_date'] = df['review_date'].str.split().str[-1]

df.to_csv(output_file, index=False)

print(f"✓ Updated {output_file}")
print(f"✓ Extracted year from review_date column")
print(f"✓ Sample values: {df['review_date'].unique()[:5]}")
