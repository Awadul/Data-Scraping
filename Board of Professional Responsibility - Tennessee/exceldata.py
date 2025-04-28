import pandas as pd
import json

# Load the JSON data
try:
    with open('merged_attorney_data.json', 'r') as file:
        data = json.load(file)
    print(f"Successfully loaded data with {len(data)} records")
except FileNotFoundError:
    print("Could not find the JSON file. Please check the file path.")
    data = []
except json.JSONDecodeError:
    print("Could not parse JSON file. Please check if the file is valid JSON.")
    data = []

# Convert to DataFrame if data is available
if data:
    # Create a pandas DataFrame from the JSON data
    df = pd.DataFrame(data)
    
    # Write the DataFrame to an Excel file
    try:
        output_file = 'attorney_data.xlsx'
        df.to_excel(output_file, index=False)
        print(f"Data successfully written to {output_file}")
    except Exception as e:
        print(f"Error writing Excel file: {e}")
else:
    print("No data to write to Excel file.")