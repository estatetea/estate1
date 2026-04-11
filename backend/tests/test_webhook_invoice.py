"""
Backend API Tests for Estate Tea - Webhook & Invoice Features
Tests: Razorpay Webhook, Invoice Status API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestInvoiceStatusAPI:
    """Invoice status endpoint tests"""
    
    def test_invoice_status_returns_config_flags(self):
        """Test /api/invoice/status returns email and sms configuration flags"""
        response = requests.get(f"{BASE_URL}/api/invoice/status")
        assert response.status_code == 200
        
        data = response.json()
        # Validate response structure
        assert "email_configured" in data
        assert "sms_configured" in data
        assert "email_provider" in data
        assert "sms_provider" in data
        
        # Validate data types
        assert isinstance(data["email_configured"], bool)
        assert isinstance(data["sms_configured"], bool)
        
        # In test env, both should be false (no API keys configured)
        assert data["email_configured"] == False
        assert data["sms_configured"] == False
        assert data["email_provider"] is None
        assert data["sms_provider"] is None
        
        print(f"Invoice status: email={data['email_configured']}, sms={data['sms_configured']}")


class TestRazorpayWebhook:
    """Razorpay webhook endpoint tests"""
    
    def test_webhook_payment_captured_event(self):
        """Test webhook handles payment.captured event and stores payment record"""
        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_captured_001",
                        "amount": 25000,
                        "currency": "INR",
                        "email": "captured@test.com",
                        "contact": "+919876543210",
                        "method": "upi",
                        "status": "captured"
                    }
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/razorpay/webhook",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "ok"
        assert data["event"] == "payment.captured"
        
        print(f"Webhook payment.captured handled: {data}")
    
    def test_webhook_payment_link_paid_event(self):
        """Test webhook handles payment_link.paid event"""
        payload = {
            "event": "payment_link.paid",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_link_test_002",
                        "amount": 40000,
                        "currency": "INR",
                        "email": "linkpaid@test.com",
                        "contact": "+919876543211",
                        "method": "card",
                        "status": "captured"
                    }
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/razorpay/webhook",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "ok"
        assert data["event"] == "payment_link.paid"
        
        print(f"Webhook payment_link.paid handled: {data}")
    
    def test_webhook_ignores_unknown_events(self):
        """Test webhook returns ignored for unknown events"""
        payload = {
            "event": "order.created",
            "payload": {}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/razorpay/webhook",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "ignored"
        assert data["event"] == "order.created"
        
        print(f"Unknown event correctly ignored: {data}")
    
    def test_webhook_rejects_invalid_json(self):
        """Test webhook rejects invalid JSON with 400 error"""
        response = requests.post(
            f"{BASE_URL}/api/razorpay/webhook",
            data="invalid json {{{",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400
        data = response.json()
        
        assert "detail" in data
        assert "Invalid JSON" in data["detail"]
        
        print(f"Invalid JSON correctly rejected: {data}")
    
    def test_webhook_handles_missing_payment_entity(self):
        """Test webhook handles payment event with missing entity gracefully"""
        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {}  # Missing entity
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/razorpay/webhook",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return ignored since no payment entity
        assert data["status"] == "ignored"
        assert data["reason"] == "no payment entity"
        
        print(f"Missing entity handled: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
