"""
Backend API tests for Estate Tea - Razorpay Integration
Tests the payment flow APIs: create-razorpay-order and verify-payment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tea-estate-store.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')


class TestRazorpayAPI:
    """Tests for Razorpay payment integration endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Estate Tea API"
        print("✓ API root endpoint accessible")
    
    def test_create_razorpay_order_success(self):
        """Test creating a Razorpay order returns valid order_id and correct key_id"""
        payload = {
            "amount": 210,
            "customer_name": "Test User",
            "variant": "250 grams"
        }
        response = requests.post(
            f"{BASE_URL}/api/create-razorpay-order",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "order_id" in data
        assert "amount" in data
        assert "currency" in data
        assert "key_id" in data
        
        # Verify order_id format (Razorpay order IDs start with 'order_')
        assert data["order_id"].startswith("order_")
        
        # Verify correct key_id (live mode)
        assert data["key_id"] == "rzp_live_Seth9MV6PhUBTJ"
        
        # Verify amount matches
        assert data["amount"] == 210
        
        # Verify currency
        assert data["currency"] == "INR"
        
        print(f"✓ Created Razorpay order: {data['order_id']}")
        print(f"✓ Key ID is live mode: {data['key_id']}")
    
    def test_create_razorpay_order_500g_variant(self):
        """Test creating order for 500g variant"""
        payload = {
            "amount": 410,
            "customer_name": "Test User 500g",
            "variant": "500 grams"
        }
        response = requests.post(
            f"{BASE_URL}/api/create-razorpay-order",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 410
        assert data["key_id"] == "rzp_live_Seth9MV6PhUBTJ"
        print(f"✓ Created 500g order: {data['order_id']}")
    
    def test_verify_payment_invalid_signature(self):
        """Test verify-payment correctly rejects invalid signatures"""
        payload = {
            "razorpay_payment_id": "pay_test123",
            "razorpay_order_id": "order_test123",
            "razorpay_signature": "invalid_signature"
        }
        response = requests.post(
            f"{BASE_URL}/api/verify-payment",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return verified: false for invalid signature
        assert data["verified"] == False
        assert "error" in data
        assert "Invalid payment signature" in data["error"]
        print("✓ Invalid signature correctly rejected")
    
    def test_verify_payment_missing_fields(self):
        """Test verify-payment returns 400 for missing fields"""
        payload = {
            "razorpay_payment_id": "pay_test123"
            # Missing order_id and signature
        }
        response = requests.post(
            f"{BASE_URL}/api/verify-payment",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400
        print("✓ Missing fields correctly returns 400")
    
    def test_invoice_status_endpoint(self):
        """Test invoice status endpoint returns configuration info"""
        response = requests.get(f"{BASE_URL}/api/invoice/status")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "email_configured" in data
        assert "sms_configured" in data
        assert "email_provider" in data
        assert "sms_provider" in data
        
        print(f"✓ Invoice status: email={data['email_configured']}, sms={data['sms_configured']}")


class TestWeatherAPI:
    """Tests for weather endpoint"""
    
    def test_weather_endpoint(self):
        """Test weather endpoint returns valid data"""
        payload = {"place": "Bangalore"}
        response = requests.post(
            f"{BASE_URL}/api/weather",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "place" in data
        assert "temperature" in data
        assert "condition" in data
        assert "tea_recommendation" in data
        
        print(f"✓ Weather for {data['place']}: {data['temperature']}°C, {data['condition']}")


class TestOrdersAPI:
    """Tests for orders endpoint"""
    
    def test_create_order(self):
        """Test creating an order"""
        payload = {
            "customer_name": "TEST_User",
            "customer_age": 25,
            "customer_place": "Bangalore",
            "product_name": "Estate Premium Tea",
            "variant": "250 grams",
            "price": 200,
            "quantity": 1
        }
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["customer_name"] == "TEST_User"
        assert data["variant"] == "250 grams"
        assert data["price"] == 200
        
        print(f"✓ Created order: {data['id']}")
    
    def test_get_orders(self):
        """Test getting orders list"""
        response = requests.get(f"{BASE_URL}/api/orders")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
