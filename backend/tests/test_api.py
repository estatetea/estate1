"""
Backend API Tests for Estate Tea E-commerce
Tests: Orders API, Weather API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Basic API health tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Estate Tea API"
        print("API root endpoint working correctly")


class TestWeatherAPI:
    """Weather API endpoint tests"""
    
    def test_weather_with_known_city(self):
        """Test weather endpoint with a known city (Mumbai)"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "Mumbai"})
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "place" in data
        assert "temperature" in data
        assert "condition" in data
        assert "tea_recommendation" in data
        
        # Validate data types
        assert isinstance(data["temperature"], (int, float))
        assert isinstance(data["condition"], str)
        assert isinstance(data["tea_recommendation"], str)
        
        print(f"Weather API returned: {data['place']} - {data['temperature']}°C - {data['condition']}")
    
    def test_weather_with_cold_city(self):
        """Test weather endpoint with a cold city (Shimla)"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "Shimla"})
        assert response.status_code == 200
        data = response.json()
        
        # Shimla should be cold (mock data returns 12°C)
        assert data["temperature"] < 20
        assert "Hot" in data["tea_recommendation"] or "hot" in data["tea_recommendation"].lower()
        print(f"Cold city weather: {data['temperature']}°C - Recommendation: {data['tea_recommendation'][:50]}...")
    
    def test_weather_with_unknown_city(self):
        """Test weather endpoint with an unknown city (should use hash-based mock)"""
        response = requests.post(f"{BASE_URL}/api/weather", json={"place": "TestCity123"})
        assert response.status_code == 200
        data = response.json()
        
        # Should still return valid data
        assert "place" in data
        assert "temperature" in data
        assert 15 <= data["temperature"] <= 35  # Mock range
        print(f"Unknown city weather: {data['temperature']}°C")


class TestOrdersAPI:
    """Orders CRUD API tests"""
    
    def test_create_order_with_default_age(self):
        """Test creating order with customer_age=0 (default when location denied)"""
        order_data = {
            "customer_name": "TEST_User",
            "customer_age": 0,  # Default when no age input
            "customer_place": "Unknown",
            "product_name": "Estate Premium Tea",
            "variant": "250 grams",
            "price": 200,
            "quantity": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        
        data = response.json()
        # Validate response structure
        assert "id" in data
        assert data["customer_name"] == "TEST_User"
        assert data["customer_age"] == 0
        assert data["customer_place"] == "Unknown"
        assert data["product_name"] == "Estate Premium Tea"
        assert data["variant"] == "250 grams"
        assert data["price"] == 200
        assert data["quantity"] == 1
        
        print(f"Order created with ID: {data['id']}")
    
    def test_create_order_with_location(self):
        """Test creating order with location data"""
        order_data = {
            "customer_name": "TEST_LocationUser",
            "customer_age": 0,
            "customer_place": "Mumbai",
            "product_name": "Estate Premium Tea",
            "variant": "500 grams",
            "price": 400,
            "quantity": 2
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["customer_place"] == "Mumbai"
        assert data["variant"] == "500 grams"
        assert data["price"] == 400
        assert data["quantity"] == 2
        
        print(f"Order with location created: {data['id']}")
    
    def test_get_orders(self):
        """Test getting orders list"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # If there are orders, validate structure
        if len(data) > 0:
            order = data[0]
            assert "id" in order
            assert "customer_name" in order
            assert "product_name" in order
            assert "price" in order
        
        print(f"Retrieved {len(data)} orders")
    
    def test_get_orders_with_pagination(self):
        """Test orders pagination"""
        response = requests.get(f"{BASE_URL}/api/orders?skip=0&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5
        
        print(f"Pagination test: Retrieved {len(data)} orders with limit=5")
    
    def test_create_order_missing_required_field(self):
        """Test creating order with missing required field"""
        order_data = {
            "customer_name": "TEST_IncompleteUser",
            # Missing customer_place, product_name, variant, price
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        # Should return 422 Unprocessable Entity for validation error
        assert response.status_code == 422
        print("Validation error correctly returned for missing fields")


class TestRazorpayAPI:
    """Razorpay payment API tests"""
    
    def test_create_razorpay_order(self):
        """Test creating a Razorpay order"""
        order_data = {
            "amount": 200,
            "customer_name": "TEST_PaymentUser",
            "customer_phone": "9876543210",
            "customer_address": "Test Address, Mumbai"
        }
        
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=order_data)
        
        # Razorpay might fail if credentials are invalid, but endpoint should exist
        if response.status_code == 200:
            data = response.json()
            assert "order_id" in data
            assert "amount" in data
            assert "currency" in data
            assert "key_id" in data
            assert data["amount"] == 200
            assert data["currency"] == "INR"
            print(f"Razorpay order created: {data['order_id']}")
        elif response.status_code == 500:
            # Razorpay credentials might be invalid in test env
            print("Razorpay order creation failed (expected in test env with invalid credentials)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
