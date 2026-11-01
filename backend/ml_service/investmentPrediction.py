import numpy as np
from typing import Dict
import housePricePrediction

def predict_investment_property(property_data: Dict) -> Dict:
    """
    Predict investment recommendation for a property based on price comparison
    with predicted market price.
    
    Args:
        property_data: Dictionary containing property details including:
            - city, class, marlas, floors, bedrooms, bathrooms
            - porch, servant_quarter, corner_property, park_facing, house_age
            - price_pkr: Current asking price
    
    Returns:
        Dictionary with investment recommendation and analysis
    """
    
    if not housePricePrediction.is_model_loaded():
        raise Exception("House price model not loaded")
    
    # Extract investment-specific data
    current_price = property_data.get("price_pkr")
    city = property_data.get("city")
    property_class = property_data.get("class")
    
    # Prepare data for house price prediction
    house_price_data = {
        "city": city,
        "class": property_class,
        "marlas": property_data.get("marlas"),
        "floors": property_data.get("floors"),
        "bedrooms": property_data.get("bedrooms"),
        "bathrooms": property_data.get("bathrooms"),
        "porch": property_data.get("porch"),
        "servant_quarter": property_data.get("servant_quarter"),
        "corner_property": property_data.get("corner_property"),
        "park_facing": property_data.get("park_facing"),
        "house_age": property_data.get("house_age")
    }
    
    # Get predicted price from house price model
    house_price_result = housePricePrediction.predict_house_price(house_price_data)
    predicted_price = house_price_result["predicted_price"]
    
    # Calculate price difference and percentage
    price_difference = predicted_price - current_price
    price_percentage = (price_difference / current_price) * 100
    
    # Classification: positive (1) or negative (0)
    classification = 1 if price_difference > 0 else 0
    classification_probability = min(abs(price_percentage) / 100, 1.0)
    
    # ROI Score based on percentage difference
    regression_value = price_percentage
    
    # Recommendation based on price difference percentage
    if price_percentage > 10:
        recommendation = "STRONGLY INVEST"
        confidence = min(classification_probability, 0.95)
    elif price_percentage < -10:
        recommendation = "DON'T INVEST"
        confidence = min(classification_probability, 0.95)
    else:
        recommendation = "INVEST"
        confidence = 0.5
    
    # Generate analysis
    analysis = generate_investment_analysis(
        city,
        property_class,
        current_price,
        predicted_price,
        price_percentage,
        recommendation
    )
    
    return {
        "success": True,
        "recommendation": recommendation,
        "confidence": float(confidence),
        "classification": int(classification),
        "classification_probability": float(classification_probability),
        "regression_value": float(regression_value),
        "predicted_price": float(predicted_price),
        "current_price": float(current_price),
        "price_difference": float(price_difference),
        "price_percentage": float(price_percentage),
        "analysis": analysis,
        "message": "Investment prediction generated successfully"
    }


def generate_investment_analysis(city: str, property_class: str, current_price: float, 
                                 predicted_price: float, price_percentage: float, 
                                 recommendation: str) -> str:
    """
    Generate human-readable investment analysis.
    
    Args:
        city: Property city
        property_class: Property class (A+, A, B+, B, C)
        current_price: Current asking price
        predicted_price: Predicted market price
        price_percentage: Price difference percentage
        recommendation: Investment recommendation (BUY, SELL, HOLD)
    
    Returns:
        Human-readable analysis string
    """
    
    analysis_text = f"Property in {city} ({property_class} class): "
    
    if recommendation == "STRONGLY INVEST":
        analysis_text += f"This property is undervalued by {abs(price_percentage):.1f}%. The predicted market price is Rs. {predicted_price:,.0f} compared to the current asking price of Rs. {current_price:,.0f}. This presents a strong investment opportunity with good appreciation potential."
    elif recommendation == "DON'T INVEST":
        analysis_text += f"This property is overvalued by {abs(price_percentage):.1f}%. The predicted market price is Rs. {predicted_price:,.0f} compared to the current asking price of Rs. {current_price:,.0f}. Consider avoiding this property or negotiating a significantly lower price."
    else:  # INVEST
        analysis_text += f"This property is fairly valued with a price difference of {price_percentage:.1f}%. The predicted market price is Rs. {predicted_price:,.0f} while the current asking price is Rs. {current_price:,.0f}. This is a moderate investment opportunity with balanced risk-reward."
    
    return analysis_text
