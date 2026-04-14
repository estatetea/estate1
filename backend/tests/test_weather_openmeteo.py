"""
Backend API Tests for Estate Tea - Open-Meteo Weather API
Tests: Weather API with real Open-Meteo data (no API key needed)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestWeatherOpenMeteoAPI:
    """Weather API tests with Open-Meteo integration"""
    
    def test_weather_bangalore_returns_real_temperature(self):
        """Test weather for Bangalore returns real temperature from Open-Meteo"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "Bangalore"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Validate response structure
        assert "place" in data
        assert "temperature" in data
        assert "condition" in data
        assert "tea_recommendation" in data
        
        # Bangalore should return real temperature (typically 20-35°C range)
        # Open-Meteo returns "Bengaluru" as the official name
        assert data["place"] in ["Bangalore", "Bengaluru"]
        assert isinstance(data["temperature"], (int, float))
        assert 10 <= data["temperature"] <= 45  # Reasonable range for Bangalore
        
        # Condition should be a real weather condition
        valid_conditions = ["Clear Sky", "Partly Cloudy", "Foggy", "Drizzle", "Rainy", 
                          "Snowy", "Showers", "Snow Showers", "Thunderstorm", 
                          "Cold", "Pleasant", "Warm", "Hot"]
        assert data["condition"] in valid_conditions
        
        # Tea recommendation should be based on temperature
        assert len(data["tea_recommendation"]) > 10
        
        print(f"Bangalore weather: {data['temperature']}°C, {data['condition']}")
        print(f"Tea recommendation: {data['tea_recommendation']}")
    
    def test_weather_mumbai_returns_real_temperature(self):
        """Test weather for Mumbai returns real temperature"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "Mumbai"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Mumbai is typically hot (25-35°C)
        assert isinstance(data["temperature"], (int, float))
        assert 15 <= data["temperature"] <= 45
        
        print(f"Mumbai weather: {data['temperature']}°C, {data['condition']}")
    
    def test_weather_shimla_returns_cooler_temperature(self):
        """Test weather for Shimla (hill station) returns cooler temperature"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "Shimla"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Shimla is a hill station, typically cooler (5-25°C)
        assert isinstance(data["temperature"], (int, float))
        assert -5 <= data["temperature"] <= 30  # Hill station range
        
        # If temperature is below 25, should recommend hot tea
        if data["temperature"] < 25:
            assert "Hot" in data["tea_recommendation"] or "hot" in data["tea_recommendation"].lower()
        
        print(f"Shimla weather: {data['temperature']}°C, {data['condition']}")
        print(f"Tea recommendation: {data['tea_recommendation']}")
    
    def test_weather_delhi_with_coordinates(self):
        """Test weather for Delhi with explicit lat/lon coordinates"""
        response = requests.post(f"{BASE_URL}/api/weather", json={
            "place": "Delhi",
            "latitude": 28.6139,
            "longitude": 77.2090
        })
        assert response.status_code == 200
        
        data = response.json()
        
        # Should use provided coordinates directly
        assert isinstance(data["temperature"], (int, float))
        assert 5 <= data["temperature"] <= 50  # Delhi can be extreme
        
        # Validate condition is real
        valid_conditions = ["Clear Sky", "Partly Cloudy", "Foggy", "Drizzle", "Rainy", 
                          "Snowy", "Showers", "Snow Showers", "Thunderstorm", 
                          "Cold", "Pleasant", "Warm", "Hot"]
        assert data["condition"] in valid_conditions
        
        print(f"Delhi (with coords) weather: {data['temperature']}°C, {data['condition']}")
    
    def test_weather_unknown_city_fallback(self):
        """Test weather for unknown city falls back gracefully"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "XyzNonExistentCity12345"})
        assert response.status_code == 200
        
        data = response.json()
        
        # Should still return valid response (fallback)
        assert "place" in data
        assert "temperature" in data
        assert "condition" in data
        assert "tea_recommendation" in data
        
        # Fallback uses hash-based temperature (15-35 range)
        assert isinstance(data["temperature"], (int, float))
        assert 10 <= data["temperature"] <= 40
        
        print(f"Unknown city fallback: {data['temperature']}°C, {data['condition']}")
    
    def test_weather_condition_mapping(self):
        """Test that weather conditions are properly mapped from WMO codes"""
        # Test multiple cities to get different conditions
        cities = ["Bangalore", "Mumbai", "Delhi", "Chennai", "Kolkata"]
        conditions_found = set()
        
        for city in cities:
            response = requests.post(f"{BASE_URL}/api/weather", json={"place": city})
            assert response.status_code == 200
            data = response.json()
            conditions_found.add(data["condition"])
        
        # Should have at least one valid condition
        valid_conditions = {"Clear Sky", "Partly Cloudy", "Foggy", "Drizzle", "Rainy", 
                          "Snowy", "Showers", "Snow Showers", "Thunderstorm", 
                          "Cold", "Pleasant", "Warm", "Hot"}
        
        for condition in conditions_found:
            assert condition in valid_conditions, f"Invalid condition: {condition}"
        
        print(f"Conditions found across cities: {conditions_found}")
    
    def test_tea_recommendation_hot_weather(self):
        """Test tea recommendation for hot weather (>30°C)"""
        # Chennai is typically hot
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "Chennai"})
        assert response.status_code == 200
        
        data = response.json()
        
        # If temperature is above 30, should recommend cold tea
        if data["temperature"] >= 30:
            assert "Cold" in data["tea_recommendation"] or "Iced" in data["tea_recommendation"] or "ice" in data["tea_recommendation"].lower()
            print(f"Hot weather ({data['temperature']}°C) - Cold tea recommended: {data['tea_recommendation'][:50]}...")
        else:
            print(f"Chennai temperature ({data['temperature']}°C) not hot enough for cold tea test")
    
    def test_tea_recommendation_cold_weather(self):
        """Test tea recommendation for cold weather (<15°C)"""
        # Shimla or Manali should be cold
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "Manali"})
        assert response.status_code == 200
        
        data = response.json()
        
        # If temperature is below 15, should recommend hot tea with ginger
        if data["temperature"] < 15:
            assert "Hot" in data["tea_recommendation"] or "ginger" in data["tea_recommendation"].lower()
            print(f"Cold weather ({data['temperature']}°C) - Hot tea recommended: {data['tea_recommendation'][:50]}...")
        else:
            print(f"Manali temperature ({data['temperature']}°C) not cold enough for hot tea test")


class TestWeatherAPIValidation:
    """Weather API input validation tests"""
    
    def test_weather_empty_place(self):
        """Test weather with empty place string"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": ""})
        # Should either return 422 validation error or fallback
        assert response.status_code in [200, 422]
        
        if response.status_code == 200:
            data = response.json()
            # Should have fallback data
            assert "temperature" in data
            print(f"Empty place handled with fallback: {data['temperature']}°C")
        else:
            print("Empty place correctly rejected with 422")
    
    def test_weather_missing_place(self):
        """Test weather with missing place field"""
        response = requests.post(f"{BASE_URL}/api/weather", json={})
        # Should return 422 validation error
        assert response.status_code == 422
        print("Missing place field correctly rejected with 422")
    
    def test_weather_with_only_coordinates(self):
        """Test weather with coordinates but no place name"""
        response = requests.post(f"{BASE_URL}/api/weather", json={
            "place": "Custom Location",
            "latitude": 12.9716,
            "longitude": 77.5946
        })
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data["temperature"], (int, float))
        
        print(f"Coordinates-only weather: {data['temperature']}°C at {data['place']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
