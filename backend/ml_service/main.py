from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
import pickle
import pandas as pd
import numpy as np
import os
from typing import List, Optional
import housePricePrediction
import investmentPrediction
print("MAIN.PY STARTED")
try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False
    print("⚠ joblib not available. Install with: pip install joblib")

app = FastAPI(title="Investment Opportunities API", docs_url="/docs", redoc_url="/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("MAIN.PY STARTED")
model = None
model_data = None
all_predictions = None


housePricePrediction.load_house_price_models()


print("MAIN.PY STARTED")




class HousePricePredictionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    city: str
    property_class: str = Field(..., alias="class")
    marlas: int
    floors: int
    bedrooms: int
    bathrooms: int
    porch: int
    servant_quarter: int
    corner_property: int
    park_facing: int
    house_age: int


class PropertyInvestmentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    city: str
    property_class: str = Field(..., alias="class")
    price_pkr: float
    marlas: float
    floors: int
    bedrooms: int
    bathrooms: int
    porch: int
    servant_quarter: int
    corner_property: int
    park_facing: int
    house_age: int








@app.post("/api/house-price/predict")
def predict_house_price(request: HousePricePredictionRequest):
    try:
        if not housePricePrediction.is_model_loaded():
            raise HTTPException(status_code=500, detail="House price model or feature encoder not loaded")
        
        property_data = {
            "city": request.city,
            "class": request.property_class,
            "marlas": request.marlas,
            "floors": request.floors,
            "bedrooms": request.bedrooms,
            "bathrooms": request.bathrooms,
            "porch": request.porch,
            "servant_quarter": request.servant_quarter,
            "corner_property": request.corner_property,
            "park_facing": request.park_facing,
            "house_age": request.house_age
        }
        
        result = housePricePrediction.predict_house_price(property_data)
        
        return {
            "success": True,
            "predicted_price": result["predicted_price"],
            "formatted_price": result["formatted_price"],
            "message": result["message"]
        }
    
    except Exception as e:
        print(f"Error in predict_house_price: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/investments/predict-property")
def predict_investment_property(request: PropertyInvestmentRequest):
    try:
        property_data = {
            "city": request.city,
            "class": request.property_class,
            "price_pkr": request.price_pkr,
            "marlas": request.marlas,
            "floors": request.floors,
            "bedrooms": request.bedrooms,
            "bathrooms": request.bathrooms,
            "porch": request.porch,
            "servant_quarter": request.servant_quarter,
            "corner_property": request.corner_property,
            "park_facing": request.park_facing,
            "house_age": request.house_age
        }
        
        result = investmentPrediction.predict_investment_property(property_data)
        return result
    
    except Exception as e:
        print(f"Error in predict_investment_property: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))





if __name__ == "__main__":
    import uvicorn
    print("Starting ML Service on http://localhost:8001")
    print("API Docs available at http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")