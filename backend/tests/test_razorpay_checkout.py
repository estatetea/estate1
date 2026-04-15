"""
Backend API Tests for Razorpay Standard Checkout Integration
Tests: create-razorpay-order, verify-payment endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCreateRazorpayOrder:
    """Tests for POST /api/create-razorpay-order endpoint"""
    
    def test_create_order_success(self):
        """Test creating a Razorpay order with valid data"""
        payload = {
            "amount": 200,
            "customer_name": "TEST_CheckoutUser",
            "variant": "250 grams"
        }
        
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Validate response structure
        assert "order_id" in data, "Response missing order_id"
        assert "amount" in data, "Response missing amount"
        assert "currency" in data, "Response missing currency"
        assert "key_id" in data, "Response missing key_id"
        
        # Validate values
        assert data["amount"] == 200, f"Expected amount 200, got {data['amount']}"
        assert data["currency"] == "INR", f"Expected currency INR, got {data['currency']}"
        assert data["order_id"].startswith("order_"), f"Order ID should start with 'order_', got {data['order_id']}"
        assert data["key_id"].startswith("rzp_test_"), f"Key ID should be test key, got {data['key_id']}"
        
        print(f"✓ Razorpay order created: {data['order_id']}, amount: ₹{data['amount']}")
    
    def test_create_order_with_multiple_variants(self):
        """Test creating order with multiple variants (comma-separated)"""
        payload = {
            "amount": 600,
            "customer_name": "TEST_MultiVariant",
            "variant": "250 grams, 500 grams"
        }
        
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount"] == 600
        assert "order_id" in data
        
        print(f"✓ Multi-variant order created: {data['order_id']}")
    
    def test_create_order_empty_variant(self):
        """Test creating order with empty variant (allowed)"""
        payload = {
            "amount": 400,
            "customer_name": "TEST_EmptyVariant",
            "variant": ""
        }
        
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount"] == 400
        
        print(f"✓ Order with empty variant created: {data['order_id']}")
    
    def test_create_order_missing_amount(self):
        """Test creating order without amount (should fail validation)"""
        payload = {
            "customer_name": "TEST_NoAmount",
            "variant": "250 grams"
        }
        
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=payload)
        assert response.status_code == 422, f"Expected 422 for missing amount, got {response.status_code}"
        
        print("✓ Validation error for missing amount")
    
    def test_create_order_missing_customer_name(self):
        """Test creating order without customer_name (should fail validation)"""
        payload = {
            "amount": 200,
            "variant": "250 grams"
        }
        
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=payload)
        assert response.status_code == 422, f"Expected 422 for missing customer_name, got {response.status_code}"
        
        print("✓ Validation error for missing customer_name")


class TestVerifyPayment:
    """Tests for POST /api/verify-payment endpoint"""
    
    def test_verify_payment_missing_all_fields(self):
        """Test verify-payment with empty body (should return 400)"""
        response = requests.post(f"{BASE_URL}/api/verify-payment", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Response should have detail field"
        assert "Missing payment details" in data["detail"], f"Unexpected error: {data['detail']}"
        
        print("✓ Verify payment returns 400 for empty body")
    
    def test_verify_payment_missing_payment_id(self):
        """Test verify-payment with missing razorpay_payment_id"""
        payload = {
            "razorpay_order_id": "order_test123",
            "razorpay_signature": "test_signature"
        }
        
        response = requests.post(f"{BASE_URL}/api/verify-payment", json=payload)
        assert response.status_code == 400
        
        print("✓ Verify payment returns 400 for missing payment_id")
    
    def test_verify_payment_missing_order_id(self):
        """Test verify-payment with missing razorpay_order_id"""
        payload = {
            "razorpay_payment_id": "pay_test123",
            "razorpay_signature": "test_signature"
        }
        
        response = requests.post(f"{BASE_URL}/api/verify-payment", json=payload)
        assert response.status_code == 400
        
        print("✓ Verify payment returns 400 for missing order_id")
    
    def test_verify_payment_missing_signature(self):
        """Test verify-payment with missing razorpay_signature"""
        payload = {
            "razorpay_payment_id": "pay_test123",
            "razorpay_order_id": "order_test123"
        }
        
        response = requests.post(f"{BASE_URL}/api/verify-payment", json=payload)
        assert response.status_code == 400
        
        print("✓ Verify payment returns 400 for missing signature")
    
    def test_verify_payment_invalid_signature(self):
        """Test verify-payment with invalid signature (should return verified: false)"""
        payload = {
            "razorpay_payment_id": "pay_test123",
            "razorpay_order_id": "order_test123",
            "razorpay_signature": "invalid_signature_abc123"
        }
        
        response = requests.post(f"{BASE_URL}/api/verify-payment", json=payload)
        # Should return 200 with verified: false (not 400/500)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("verified") == False, "Should return verified: false for invalid signature"
        assert "error" in data or "Invalid" in str(data), "Should indicate signature error"
        
        print("✓ Verify payment returns verified: false for invalid signature")


class TestInvoiceStatus:
    """Tests for GET /api/invoice/status endpoint"""
    
    def test_invoice_status_endpoint(self):
        """Test invoice status endpoint returns service configuration"""
        response = requests.get(f"{BASE_URL}/api/invoice/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "email_configured" in data
        assert "sms_configured" in data
        assert isinstance(data["email_configured"], bool)
        assert isinstance(data["sms_configured"], bool)
        
        print(f"✓ Invoice status: email={data['email_configured']}, sms={data['sms_configured']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
