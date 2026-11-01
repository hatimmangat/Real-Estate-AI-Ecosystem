import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "investment_model.pkl")

print("=" * 70)
print("INVESTMENT MODEL INSPECTION TOOL")
print("=" * 70)

loaders = []

try:
    import pickle
    loaders.append(('pickle', pickle))
except ImportError:
    print("pickle not available")

try:
    import joblib
    loaders.append(('joblib', joblib))
except ImportError:
    print("joblib not available (install with: pip install joblib)")

try:
    import dill
    loaders.append(('dill', dill))
except ImportError:
    pass

try:
    import pandas as pd
    loaders.append(('pandas', pd))
except ImportError:
    pass

print(f"\nModel file: {MODEL_PATH}")
print(f"File exists: {os.path.exists(MODEL_PATH)}")

if os.path.exists(MODEL_PATH):
    file_size = os.path.getsize(MODEL_PATH)
    print(f"File size: {file_size} bytes ({file_size / 1024:.2f} KB)")

print(f"\nTrying {len(loaders)} loading methods...\n")

model_data = None
successful_loader = None

for loader_name, loader_module in loaders:
    try:
        print(f"Trying {loader_name}...", end=" ")
        
        if loader_name == 'pandas':
            try:
                model_data = pd.read_pickle(MODEL_PATH)
                successful_loader = f'{loader_name}.read_pickle'
                print(f"✓ SUCCESS with {successful_loader}")
                break
            except:
                print("✗ Failed")
                continue
        else:
            with open(MODEL_PATH, "rb") as f:
                model_data = loader_module.load(f)
            successful_loader = loader_name
            print(f"✓ SUCCESS")
            break
            
    except Exception as e:
        print(f"✗ Failed: {str(e)[:50]}")
        continue

if model_data is None:
    print("\n" + "="*70)
    print("❌ FAILED TO LOAD MODEL WITH ANY METHOD")
    print("="*70)
    print("\nThe file might be:")
    print("  1. Corrupted")
    print("  2. Not a pickle/joblib file")
    print("  3. Saved with a different Python version")
    print("  4. A different file format (CSV, JSON, etc)")
    print("\nPlease check how the model file was created.")
    print("\nIf you have the training script, please share it so I can help.")
    exit()

print(f"\n{'='*70}")
print(f"✓ MODEL LOADED SUCCESSFULLY WITH: {successful_loader}")
print(f"{'='*70}")

import pandas as pd
import numpy as np

print(f"\nType: {type(model_data)}")
print(f"Class: {model_data.__class__.__name__}")

if isinstance(model_data, dict):
    print(f"\n{'='*70}")
    print(f"MODEL STRUCTURE: Dictionary with {len(model_data)} keys")
    print(f"{'='*70}")
    
    for key, value in model_data.items():
        print(f"\n📌 Key: '{key}'")
        print(f"   Type: {type(value)}")
        
        if isinstance(value, (list, pd.DataFrame, np.ndarray)):
            print(f"   Length: {len(value)}")
            
            if isinstance(value, pd.DataFrame):
                print(f"   Columns: {list(value.columns)}")
                print(f"\n   📊 First 3 rows:")
                print(value.head(3))
                
            elif isinstance(value, list) and len(value) > 0:
                print(f"   First item: {value[0]}")

elif isinstance(model_data, pd.DataFrame):
    print(f"\n{'='*70}")
    print(f"MODEL IS A DATAFRAME!")
    print(f"{'='*70}")
    print(f"\n   Shape: {model_data.shape}")
    print(f"   Columns: {list(model_data.columns)}")
    print(f"   Column types:")
    for col in model_data.columns:
        print(f"      - {col}: {model_data[col].dtype}")
    print(f"\n   📊 First 5 rows:")
    print(model_data.head().to_string())
    print(f"\n   📊 Sample values from first row:")
    for col in model_data.columns:
        val = model_data[col].iloc[0]
        print(f"      {col} = {val} (type: {type(val).__name__})")

elif isinstance(model_data, (list, np.ndarray)):
    print(f"\n{'='*70}")
    print(f"MODEL IS AN ARRAY!")
    print(f"{'='*70}")
    print(f"\n   Length: {len(model_data)}")
    print(f"   First items: {model_data[:5]}")

else:
    print(f"\n{'='*70}")
    print(f"MODEL IS A CUSTOM OBJECT")
    print(f"{'='*70}")
    
    if hasattr(model_data, '__dict__'):
        attrs = [a for a in dir(model_data) if not a.startswith('_')]
        print(f"\n   Attributes: {attrs[:20]}")

print(f"\n{'='*70}")
print(f"💡 FIX FOR main.py")
print(f"{'='*70}\n")

print(f"Change line 29 in main.py from:")
print(f"    model_data = pickle.load(f)")
print(f"\nTo:")
print(f"    model_data = {successful_loader}.load(f)")

if successful_loader == 'joblib':
    print(f"\nAnd add at the top of main.py:")
    print(f"    import joblib")

print("\n" + "="*70)
print("✓ Inspection complete!")
print("="*70 + "\n")
