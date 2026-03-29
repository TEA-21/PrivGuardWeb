import io
import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np

# Bind parent paths natively
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def generate_noise_image(width=100, height=100, format='JPEG'):
    # Generate a pure noise PIL image mapping arrays cleanly
    array = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(array, 'RGB')
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf.read()

# --- 1. Payload Edge Cases (SDET Structure) ---

def test_upload_malformed_image_bytes():
    # Attempting to force an OpenCV silent crash via corrupt hex signatures
    broken_bytes = b"NOT_A_VALID_IMAGE_STRUCT_JUST_GARBAGE_BYTES"
    response = client.post("/scan-image", files={"image": ("broken.jpg", broken_bytes, "image/jpeg")})
    assert response.status_code == 400
    assert "Failed to decode image data" in response.json()["detail"]

def test_upload_non_image_file():
    # Bypassing payload validation via strictly injecting pure text streams mapped improperly
    text_content = b"This is a hidden payload script payload"
    response = client.post("/scan-image", files={"image": ("secret.txt", text_content, "text/plain")})
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

@patch('main.reader.readtext')
@patch('main.face_cascade')
def test_massive_resolution_image_limits(mock_face_cascade, mock_readtext):
    # Firing massive 5000x5000 images purely verifying HTTP buffer allocation
    # Mocking ML outputs exclusively to prevent local Out-of-Memory OS freezes natively
    mock_readtext.return_value = []
    mock_face_cascade.detectMultiScale.return_value = []
    
    giant_image = generate_noise_image(width=5000, height=5000)
    response = client.post("/scan-image", files={"image": ("massive.jpg", giant_image, "image/jpeg")})
    
    assert response.status_code == 200
    assert response.json()["facesDetected"] == 0

# --- 2. Computer Vision Edge Cases ---

@patch('main.reader.readtext')
def test_completely_blank_image(mock_readtext):
    mock_readtext.return_value = []
    
    # Generate 300x300 pure black bounds triggering clean CV maps natively
    pure_black = bytes([0] * 300 * 300 * 3)
    img = Image.frombytes('RGB', (300, 300), pure_black)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    
    response = client.post("/scan-image", files={"image": ("empty.jpg", buf.read(), "image/jpeg")})
    assert response.status_code == 200
    
    data = response.json()
    assert data["facesDetected"] == 0
    assert len(data["entities"]) == 0
    assert data["riskLevel"] == "Clean"

# --- 3. Presidio NLP Deduplication Boundaries ---

@patch('main.reader.readtext')
def test_nlp_pii_injection_parsing(mock_readtext):
    # Statically inject mock EasyOCR bounds ensuring NLP captures the textual limits safely
    mock_readtext.return_value = [
        ([0,0,0,0], "Confidential: My SSN is 000-00-0000 and email is admin@secure.net", 0.99)
    ]
    
    img_bytes = generate_noise_image(100, 100)
    response = client.post("/scan-image", files={"image": ("text_image.jpg", img_bytes, "image/jpeg")})
    
    assert response.status_code == 200
    data = response.json()
    
    entities = data["entities"]
    types = [e["type"] for e in entities]
    
    # Natively maps generic regex NLP matches
    assert len(entities) > 0
    assert "EMAIL_ADDRESS" in types
    
    # Overrides risk mapping explicitly
    assert data["riskScore"] > 20
    assert data["riskLevel"] in ["Medium", "High", "Critical"]

@patch('main.reader.readtext')
def test_nlp_overlapping_boundaries_deduplication(mock_readtext):
    # Simulates densely packed structural collisions
    mock_readtext.return_value = [
        ([0,0,0,0], "Email administrator Peter Parker at peter.parker@dailybugle.com", 0.99)
    ]
    
    img_bytes = generate_noise_image(100, 100)
    response = client.post("/scan-image", files={"image": ("dense.jpg", img_bytes, "image/jpeg")})
    
    assert response.status_code == 200
    entities = response.json()["entities"]
    
    # Evaluates collision filtering logic maps perfectly identifying components individually
    values = [e["value"].lower() for e in entities]
    assert "peter parker" in values
    assert "peter.parker@dailybugle.com" in values
