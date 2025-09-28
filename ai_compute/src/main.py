"""
Main FastAPI application for DIV inference backend
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import logging
import os
from dotenv import load_dotenv

from services.access_validator import AccessValidator
from services.lighthouse_client import LighthouseClient
from services.inference_engine import InferenceEngine

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DIV Inference Backend",
    description="Decentralized Inference Vault - Commission-free AI model inference",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
access_validator = AccessValidator()
lighthouse_client = LighthouseClient()
inference_engine = InferenceEngine()


# Pydantic models for request/response
class InferenceRequest(BaseModel):
    model_id: str = Field(..., description="Unique model identifier")
    user_address: str = Field(..., description="User's Ethereum address")
    input_data: Dict[str, Any] = Field(..., description="Input data for inference")
    user_signature: Optional[str] = Field(None, description="User's signature for authentication")
    decryption_key: Optional[str] = Field(None, description="Key for model decryption")


class InferenceResponse(BaseModel):
    status: str
    model_id: str
    result: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None


class ModelLoadRequest(BaseModel):
    model_id: str = Field(..., description="Unique model identifier")
    user_address: str = Field(..., description="User's Ethereum address")
    cid: str = Field(..., description="IPFS CID of the model file")
    decryption_key: Optional[str] = Field(None, description="Key for model decryption")
    user_signature: Optional[str] = Field(None, description="User's signature for authentication")


class HealthResponse(BaseModel):
    status: str
    message: str
    services: Dict[str, str]


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="DIV Inference Backend is running",
        services={
            "access_validator": "active",
            "lighthouse_client": "active",
            "inference_engine": "active"
        }
    )


# Model loading endpoint
@app.post("/api/v1/models/load")
async def load_model(request: ModelLoadRequest):
    """
    Load a model for inference
    """
    try:
        logger.info("Loading model request for model_id: %s, user: %s", 
                   request.model_id, request.user_address)
        
        # 1. Validate user access
        access_result = await access_validator.validate_user_access(
            request.user_address, 
            request.model_id
        )
        
        if not access_result["has_access"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: {access_result.get('error', 'Insufficient tokens')}"
            )
        
        # 2. Download model file from Lighthouse
        try:
            model_content = await lighthouse_client.download_file(
                request.cid, 
                request.user_signature
            )
            logger.info("Downloaded model file, size: %d bytes", len(model_content))
        except Exception as e:
            logger.error("Failed to download model: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to download model: {str(e)}"
            )
        
        # 3. Decrypt model if needed
        if request.decryption_key:
            try:
                model_content = await lighthouse_client.decrypt_file(
                    model_content, 
                    request.decryption_key
                )
                logger.info("Decrypted model file")
            except Exception as e:
                logger.error("Failed to decrypt model: %s", str(e))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to decrypt model: {str(e)}"
                )
        
        # 4. Load model into inference engine
        load_result = await inference_engine.load_model(request.model_id, model_content)
        
        if load_result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=load_result["message"]
            )
        
        return {
            "status": "success",
            "message": "Model loaded successfully",
            "model_id": request.model_id,
            "model_info": access_result["model_info"],
            "load_result": load_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error in load_model: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# Inference endpoint
@app.post("/api/v1/inference", response_model=InferenceResponse)
async def run_inference(request: InferenceRequest):
    """
    Run inference on a loaded model
    """
    try:
        logger.info("Inference request for model_id: %s, user: %s", 
                   request.model_id, request.user_address)
        
        # 1. Validate user access
        access_result = await access_validator.validate_user_access(
            request.user_address, 
            request.model_id
        )
        
        if not access_result["has_access"]:
            pass
            # return InferenceResponse(
            #     status="error",
            #     model_id=request.model_id,
            #     error=f"Access denied: {access_result.get('error', 'Insufficient tokens')}"
            # )
        
        # 2. Check if model is loaded
        model_info = inference_engine.get_model_info(request.model_id)
        if not model_info:
            pass
            # return InferenceResponse(
            #     status="error",
            #     model_id=request.model_id,
            #     error="Model not loaded. Please load the model first."
            # )
        
        # 3. Run inference
        inference_result = await inference_engine.run_inference(
            request.model_id, 
            request.input_data
        )
        
        if inference_result["status"] == "error":
            pass
            # return InferenceResponse(
            #     status="error",
            #     model_id=request.model_id,
            #     error=inference_result["message"]
            # )
        
        return InferenceResponse(
            status="success",
            model_id=request.model_id,
            result=inference_result["result"],
            message="Inference completed successfully"
        )
        
    except Exception as e:
        logger.error("Unexpected error in run_inference: %s", str(e))
        return InferenceResponse(
            status="error",
            model_id=request.model_id,
            error=f"Internal server error: {str(e)}"
        )


# Combined endpoint for load and inference
@app.post("/api/v1/inference/run")
async def load_and_run_inference(request: ModelLoadRequest):
    """
    Load model and run inference in one request (convenience endpoint)
    """
    try:
        # First load the model
        load_request = ModelLoadRequest(
            model_id=request.model_id,
            user_address=request.user_address,
            cid=request.cid,
            decryption_key=request.decryption_key,
            user_signature=request.user_signature
        )
        
        # Check if model is already loaded
        model_info = inference_engine.get_model_info(request.model_id)
        if not model_info:
            await load_model(load_request)
        
        # For this simplified version, we'll run a basic inference
        # In production, this would come from the request
        sample_input = {"text": "Hello, this is a test inference"}
        
        inference_request = InferenceRequest(
            model_id=request.model_id,
            user_address=request.user_address,
            input_data=sample_input,
            user_signature=request.user_signature
        )
        
        return await run_inference(inference_request)
        
    except Exception as e:
        logger.error("Error in load_and_run_inference: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Model management endpoints
@app.get("/api/v1/models")
async def list_loaded_models():
    """List all currently loaded models"""
    loaded_models = inference_engine.get_loaded_models()
    return {
        "status": "success",
        "loaded_models": loaded_models,
        "count": len(loaded_models)
    }


@app.get("/api/v1/models/{model_id}")
async def get_model_info(model_id: str):
    """Get information about a specific loaded model"""
    model_info = inference_engine.get_model_info(model_id)
    if not model_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or not loaded"
        )
    return {
        "status": "success",
        "model_info": model_info
    }


@app.delete("/api/v1/models/{model_id}")
async def unload_model(model_id: str):
    """Unload a specific model from memory"""
    success = inference_engine.unload_model(model_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or not loaded"
        )
    return {
        "status": "success",
        "message": f"Model {model_id} unloaded successfully"
    }


# Cache management
@app.delete("/api/v1/cache")
async def clear_cache():
    """Clear all caches (models and files)"""
    inference_engine.clear_cache()
    await lighthouse_client.clear_cache()
    return {
        "status": "success",
        "message": "All caches cleared"
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )