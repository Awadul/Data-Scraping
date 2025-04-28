import os
import pandas as pd

# Directory containing the CSV files
ids_directory = 'ids'
# Output file
output_file = 'combined_ids.csv'

# List to store all IDs
all_ids = []

# Iterate over all files in the directory
for filename in os.listdir(ids_directory):
    if filename.endswith('.csv'):
        # Read the CSV file
        file_path = os.path.join(ids_directory, filename)
        df = pd.read_csv(file_path)
        # Assuming the IDs are in the first column
        ids = df.iloc[:, 0].tolist()
        all_ids.extend(ids)

# Write all IDs to the output file in a comma-separated format, each on a new line
with open(output_file, 'w') as f:
    f.write(',\n'.join(map(str, all_ids)) + '\n')

print(f"All IDs have been combined into {output_file}") 