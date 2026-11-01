import pickle
import pandas as pd
import numpy as np
import os
from typing import Dict

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

house_price_model = None
feature_encoder = None

def load_model_file(filepath):
    
    if JOBLIB_AVAILABLE:
        try:
            print(f"Trying joblib.load() from {filepath}...")
            data = joblib.load(filepath)
            print("✓ Loaded with joblib")
            return data
        except Exception as e:
            print(f"joblib failed: {str(e)[:100]}")
    
    try:
        print(f"Trying pickle.load() from {filepath}...")
        with open(filepath, "rb") as f:
            data = pickle.load(f)
        print("✓ Loaded with pickle")
        return data
    except Exception as e:
        print(f"pickle failed: {str(e)[:100]}")
    
    try:
        print(f"Trying pandas.read_pickle() from {filepath}...")
        data = pd.read_pickle(filepath)
        print("✓ Loaded with pandas.read_pickle")
        return data
    except Exception as e:
        print(f"pandas.read_pickle failed: {str(e)[:100]}")
    
    raise Exception(f"Failed to load model from {filepath} with any method. File might be corrupted.")


def load_house_price_models():
    global house_price_model, feature_encoder
    
    try:
        HOUSE_PRICE_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "house_price_model.pkl")
        FEATURE_ENCODER_PATH = os.path.join(os.path.dirname(__file__), "models", "feature_encoder.pkl")
        
        print(f"\nLoading house price model from: {HOUSE_PRICE_MODEL_PATH}")
        house_price_model = load_model_file(HOUSE_PRICE_MODEL_PATH)
        print(f"✓ House price model loaded successfully")
        print(f"Model type: {type(house_price_model)}")
        
        print(f"\nLoading feature encoder from: {FEATURE_ENCODER_PATH}")
        feature_encoder = load_model_file(FEATURE_ENCODER_PATH)
        print(f"✓ Feature encoder loaded successfully")
        print(f"Encoder type: {type(feature_encoder)}")
        
        print("="*60)
        print("✓✓✓ HOUSE PRICE MODEL LOADED SUCCESSFULLY ✓✓✓")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading house price model: {e}")
        import traceback
        traceback.print_exc()
        print("\n" + "="*60)
        print("⚠ House price model loading failed")
        print("="*60)
        return False


def predict_house_price(property_data: Dict) -> Dict:
    global house_price_model, feature_encoder
    
    if house_price_model is None:
        raise Exception("House price model not loaded")
    
    input_data = pd.DataFrame([{
        "city": property_data["city"],
        "class": property_data["class"],
        "marlas": property_data["marlas"],
        "floors": property_data["floors"],
        "bedrooms": property_data["bedrooms"],
        "bathrooms": property_data["bathrooms"],
        "porch": property_data["porch"],
        "servant_quarter": property_data["servant_quarter"],
        "corner_property": property_data["corner_property"],
        "park_facing": property_data["park_facing"],
        "house_age": property_data["house_age"]
    }])
    
    # Handle feature_encoder
    if feature_encoder is not None:
        print(f"Feature encoder type: {type(feature_encoder)}")
        
        # If it's a list with one element, try to extract the transformer
        if isinstance(feature_encoder, list) and len(feature_encoder) == 1:
            encoder = feature_encoder[0]
            print(f"Extracted encoder from list: {type(encoder)}")
            if hasattr(encoder, 'transform'):
                encoded_features = encoder.transform(input_data)
                prediction = house_price_model.predict(encoded_features)
            else:
                # List contains something else, use pipeline directly
                print(f"List element is not a transformer, using pipeline")
                prediction = house_price_model.predict(input_data)
        elif hasattr(feature_encoder, 'transform'):
            # It's a proper transformer object
            encoded_features = feature_encoder.transform(input_data)
            prediction = house_price_model.predict(encoded_features)
        elif isinstance(feature_encoder, list):
            # It's a list of something else (maybe column names or other data)
            print(f"Feature encoder is a list, using pipeline directly")
            prediction = house_price_model.predict(input_data)
        else:
            # Unknown type, use pipeline
            print(f"Unknown feature encoder type, using pipeline directly")
            prediction = house_price_model.predict(input_data)
    else:
        # No feature encoder, use pipeline directly
        print(f"No feature encoder loaded, using pipeline directly")
        prediction = house_price_model.predict(input_data)
    
    # Apply inverse log transform (expm1) to get actual price
    predicted_price = float(np.expm1(prediction[0]))
    formatted_price = f"PKR {predicted_price:,.2f}"
    
    return {
        "predicted_price": predicted_price,
        "formatted_price": formatted_price,
        "message": "House price prediction generated successfully"
    }


def is_model_loaded() -> bool:
    return house_price_model is not None