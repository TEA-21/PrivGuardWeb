import cv2
import numpy as np
import easyocr
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

# --- Initialization ---
app = FastAPI(title="PrivGuard Local ML Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "*",
    ],  # Allow frontend connection
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[1/3] Initializing EasyOCR (English)...")
# Initialize once globally to prevent reloading on each request
reader = easyocr.Reader(["en"], gpu=False)  # Switch 'gpu=True' if CUDA available

print("[2/3] Initializing Presidio Analyzer (spacy en_core_web_sm)...")
# Configure spacy model to fallback locally
configuration = {
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
}
provider = NlpEngineProvider(nlp_configuration=configuration)
nlp_engine = provider.create_engine()
analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])

print("[3/3] Initializing OpenCV Face Detection (Haar Cascade)...")
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
print("--- All local models loaded successfully into memory. Ready to scan! ---")


# --- Utilities ---
def get_risk_weight(entity_type: str) -> int:
    risk_mapping = {
        "CREDIT_CARD": 35,
        "US_SSN": 35,
        "US_PASSPORT": 30,
        "US_BANK_NUMBER": 30,
        "PHONE_NUMBER": 20,
        "EMAIL_ADDRESS": 25,
        "PERSON": 20,
        "LOCATION": 15,
        "IP_ADDRESS": 15,
        "US_DRIVER_LICENSE": 25,
        "IBAN_CODE": 30,
    }
    return risk_mapping.get(entity_type, 15)


def get_risk_level(score: int) -> str:
    if score >= 80:
        return "Critical"
    if score >= 60:
        return "High"
    if score >= 40:
        return "Medium"
    if score >= 20:
        return "Low"
    return "Clean"


def extract_entities_via_presidio(extracted_text: str):
    entities = []
    seen_entities = set()
    if extracted_text.strip():
        presidio_results = analyzer.analyze(
            text=extracted_text, entities=[], language="en"
        )
        for res in presidio_results:
            val = extracted_text[res.start : res.end]
            key = f"{res.entity_type}:{val.lower()}"
            if key in seen_entities:
                continue
            seen_entities.add(key)
            w = get_risk_weight(res.entity_type)
            entities.append(
                {
                    "type": res.entity_type,
                    "value": val,
                    "masked": val[:2] + "****" + val[-2:] if len(val) > 4 else "****",
                    "index": res.start,
                    "riskWeight": w,
                    "risk": "high" if w >= 30 else ("medium" if w >= 20 else "low"),
                    "source": "ml-backend",
                    "reason": "Detected by local AI privacy scanner",
                }
            )
    return entities


class TextScanRequest(BaseModel):
    text: str


# --- API Endpoint ---
@app.post("/scan-text")
async def scan_text(request: TextScanRequest):
    """
    Air-gapped text scanning endpoint natively applying local NLP.
    """
    try:
        entities = extract_entities_via_presidio(request.text)
        raw_score = sum(e["riskWeight"] for e in entities)
        risk_score = min(raw_score, 100)
        suggestions = []

        if len(entities) > 0:
            suggestions.append(
                "Ensure any visible credentials/PII are blurred or removed completely."
            )
        else:
            suggestions.append("Text appears safe: clean of visible PII.")

        return JSONResponse(
            {
                "entities": entities,
                "riskScore": risk_score,
                "riskLevel": get_risk_level(risk_score),
                "suggestions": suggestions,
            }
        )
    except Exception as e:
        print(f"Error processing text pipeline: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/scan-image")
async def scan_image(image: UploadFile = File(...)):
    """
    Stateless endpoint that expects an image upload perfectly locally.
    It runs Face Tracking, OCR, and Presidio NLP in memory.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="Invalid file type. Expecting an image."
        )

    try:
        content = await image.read()
        # Decode image array statelessly without touching the local disk
        nparr = np.frombuffer(content, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_cv is None:
            print(
                "ERROR: OpenCV failed to decode. The image payload might be malformed."
            )
            raise HTTPException(status_code=400, detail="Failed to decode image data.")

        # Mediapipe and EasyOCR expect generic RGB color format mappings
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)

        # 1. Pipeline: OpenCV Face Detection
        faces_detected = 0
        gray_img = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray_img, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        faces_detected = len(faces)

        # 2. Pipeline: EasyOCR Layout Tracking
        ocr_results = reader.readtext(img_rgb)
        # Reconstruct bounds sequentially mapped strings
        extracted_text = " ".join([res[1] for res in ocr_results])

        # 3. Pipeline: Presidio Analyzer Integration
        entities = extract_entities_via_presidio(extracted_text)

        # 4. Final Aggregation Scoring Mapping
        raw_score = sum(e["riskWeight"] for e in entities)
        suggestions = []

        # Human Biometric Force Penalty Trigger
        if faces_detected > 0:
            raw_score += 40
            suggestions.append(
                f"Image contains {faces_detected} human face(s). Avoid sharing identifiable biometrics."
            )

        risk_score = min(raw_score, 100)

        if len(entities) > 0:
            suggestions.append(
                "Ensure any visible credentials/PII are blurred or cropped out completely."
            )
        if len(entities) == 0 and faces_detected == 0:
            suggestions.append(
                "Image appears safe: clean of static visible PII and faces."
            )

        # Mapped perfectly bounding frontend payload requirements
        return JSONResponse(
            {
                "entities": entities,
                "riskScore": risk_score,
                "riskLevel": get_risk_level(risk_score),
                "suggestions": list(set(suggestions)),
                "facesDetected": faces_detected,
                "extractedText": extracted_text,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing image pipeline: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
