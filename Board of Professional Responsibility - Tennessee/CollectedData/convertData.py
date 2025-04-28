import os
import json
import glob

def merge_json_files(directory_path, output_file_path):
    """
    Merge all .json files in the specified directory into a single JSON file.
    
    Args:
        directory_path: Path to the directory containing JSON files
        output_file_path: Path where the merged JSON file will be saved
    """
    # Initialize an empty list to hold all the data
    all_data = []
    
    # Find all JSON files in the directory
    json_files = glob.glob(os.path.join(directory_path, "*.json"))
    
    print(f"Found {len(json_files)} JSON files to process")
    
    # Process each file
    for file_path in json_files:
        file_name = os.path.basename(file_path)
        print(f"Processing {file_name}...")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                file_data = json.load(file)
                
                # Check if the loaded data is a list
                if isinstance(file_data, list):
                    all_data.extend(file_data)
                else:
                    all_data.append(file_data)
                    
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from {file_name}: {e}")
        except Exception as e:
            print(f"Error processing {file_name}: {e}")
            
    # Save the merged data
    print(f"Writing {len(all_data)} records to {output_file_path}")
    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        json.dump(all_data, output_file, indent=2)
        
    print(f"Merge complete. All data saved to {output_file_path}")

if __name__ == "__main__":
    data_directory = r"c:\Users\awais\Downloads\Faseeh 25-4-25\CollectedData"
    output_file = r"c:\Users\awais\Downloads\Faseeh 25-4-25\merged_attorney_data.json"
    
    merge_json_files(data_directory, output_file)