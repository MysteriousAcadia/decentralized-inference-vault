"""
Model inference engine for processing AI model predictions
"""

import os
import io
import pickle
import logging
from typing import Dict, Any, Optional, Union
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel, pipeline
import asyncio

logger = logging.getLogger(__name__)


class InferenceEngine:
    """Handles model loading and inference processing"""
    
    def __init__(self):
        self.model_cache = {}
        self.tokenizer_cache = {}
        self.max_model_size_mb = int(os.getenv('MAX_MODEL_SIZE_MB', 1000))
        self.inference_timeout = int(os.getenv('INFERENCE_TIMEOUT_SECONDS', 30))
        
        # Set device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info("Using device: %s", self.device)
    
    async def load_model(self, model_id: str, model_content: bytes) -> Dict[str, Any]:
        """
        Load model from bytes content
        
        Args:
            model_id: Unique model identifier
            model_content: Model file content in bytes
            
        Returns:
            dict: Model loading result
        """
        try:
            # Check if model is already cached
            if model_id in self.model_cache:
                logger.info("Model already loaded in cache: %s", model_id)
                return {"status": "success", "message": "Model loaded from cache"}
            
            # Check model size
            model_size_mb = len(model_content) / (1024 * 1024)
            if model_size_mb > self.max_model_size_mb:
                raise ValueError(f"Model size ({model_size_mb:.1f}MB) exceeds maximum allowed size ({self.max_model_size_mb}MB)")
            
            # Try to load as different model types
            model_info = await self._load_model_content(model_id, model_content)
            
            self.model_cache[model_id] = model_info
            logger.info("Successfully loaded model: %s (%.1fMB)", model_id, model_size_mb)
            
            return {
                "status": "success",
                "message": f"Model loaded successfully ({model_size_mb:.1f}MB)",
                "model_type": model_info["type"],
                "device": str(self.device)
            }
            
        except Exception as e:
            logger.error("Error loading model %s: %s", model_id, str(e))
            return {
                "status": "error",
                "message": f"Failed to load model: {str(e)}"
            }
    
    async def _load_model_content(self, model_id: str, model_content: bytes) -> Dict[str, Any]:
        """Load model content and determine its type"""
        
        # Try loading as PyTorch model
        try:
            model_stream = io.BytesIO(model_content)
            model = torch.load(model_stream, map_location=self.device)
            return {
                "type": "pytorch",
                "model": model,
                "loaded_at": asyncio.get_event_loop().time()
            }
        except Exception as e:
            logger.debug("Not a PyTorch model: %s", str(e))
        
        # Try loading as pickle file
        try:
            model_stream = io.BytesIO(model_content)
            model = pickle.load(model_stream)
            return {
                "type": "pickle",
                "model": model,
                "loaded_at": asyncio.get_event_loop().time()
            }
        except Exception as e:
            logger.debug("Not a pickle model: %s", str(e))
        
        # Try loading as Hugging Face model (if it's a model directory structure)
        try:
            # This is simplified - in production you'd save the model files to disk first
            # For now, we'll create a simple text classifier pipeline as a fallback
            model = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english", device=0 if torch.cuda.is_available() else -1)
            return {
                "type": "huggingface_pipeline",
                "model": model,
                "loaded_at": asyncio.get_event_loop().time()
            }
        except Exception as e:
            logger.debug("Not a Hugging Face model: %s", str(e))
        
        raise ValueError("Unable to load model - unsupported format")
    
    async def run_inference(self, model_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inference on the specified model
        
        Args:
            model_id: Model identifier
            input_data: Input data for inference
            
        Returns:
            dict: Inference results
        """
        try:
            if model_id not in self.model_cache:
                raise ValueError(f"Model {model_id} not loaded")
            
            model_info = self.model_cache[model_id]
            model = model_info["model"]
            model_type = model_info["type"]
            
            # Run inference based on model type
            result = await asyncio.wait_for(
                self._execute_inference(model, model_type, input_data),
                timeout=self.inference_timeout
            )
            
            return {
                "status": "success",
                "model_id": model_id,
                "model_type": model_type,
                "result": result,
                "device": str(self.device)
            }
            
        except asyncio.TimeoutError:
            logger.error("Inference timeout for model %s", model_id)
            return {
                "status": "error",
                "message": f"Inference timeout ({self.inference_timeout}s)"
            }
        except Exception as e:
            logger.error("Inference error for model %s: %s", model_id, str(e))
            return {
                "status": "error",
                "message": f"Inference failed: {str(e)}"
            }
    
    async def _execute_inference(self, model: Any, model_type: str, input_data: Dict[str, Any]) -> Any:
        """Execute inference based on model type"""
        
        if model_type == "pytorch":
            return await self._pytorch_inference(model, input_data)
        elif model_type == "pickle":
            return await self._pickle_inference(model, input_data)
        elif model_type == "huggingface_pipeline":
            return await self._huggingface_inference(model, input_data)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
    
    async def _pytorch_inference(self, model: torch.nn.Module, input_data: Dict[str, Any]) -> Any:
        """Run inference on PyTorch model"""
        model.eval()
        
        with torch.no_grad():
            # Handle different input formats
            if "tensor" in input_data:
                # Direct tensor input
                input_tensor = torch.tensor(input_data["tensor"], device=self.device)
                output = model(input_tensor)
            elif "text" in input_data:
                # Text input (requires tokenization - simplified)
                text = input_data["text"]
                # This is very simplified - in production you'd use proper tokenization
                encoded = [ord(c) for c in text[:100]]  # Simple character encoding
                input_tensor = torch.tensor([encoded], dtype=torch.float32, device=self.device)
                output = model(input_tensor)
            else:
                raise ValueError("Unsupported input format for PyTorch model")
            
            # Convert output to list for JSON serialization
            if isinstance(output, torch.Tensor):
                return output.cpu().numpy().tolist()
            else:
                return str(output)
    
    async def _pickle_inference(self, model: Any, input_data: Dict[str, Any]) -> Any:
        """Run inference on pickle-loaded model"""
        
        # Assume it's a scikit-learn style model with predict method
        if hasattr(model, 'predict'):
            if "features" in input_data:
                features = np.array(input_data["features"])
                prediction = model.predict(features.reshape(1, -1))
                return prediction.tolist()
            else:
                raise ValueError("Pickle model requires 'features' in input_data")
        else:
            raise ValueError("Pickle model doesn't have predict method")
    
    async def _huggingface_inference(self, model: Any, input_data: Dict[str, Any]) -> Any:
        """Run inference on Hugging Face pipeline"""
        
        if "text" in input_data:
            text = input_data["text"]
            result = model(text)
            return result
        else:
            raise ValueError("Hugging Face model requires 'text' in input_data")
    
    def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get information about loaded model"""
        if model_id in self.model_cache:
            model_info = self.model_cache[model_id]
            return {
                "model_id": model_id,
                "type": model_info["type"],
                "loaded_at": model_info["loaded_at"],
                "device": str(self.device)
            }
        return None
    
    def unload_model(self, model_id: str) -> bool:
        """Unload model from cache"""
        if model_id in self.model_cache:
            del self.model_cache[model_id]
            if model_id in self.tokenizer_cache:
                del self.tokenizer_cache[model_id]
            logger.info("Unloaded model: %s", model_id)
            return True
        return False
    
    def get_loaded_models(self) -> list:
        """Get list of currently loaded models"""
        return list(self.model_cache.keys())
    
    def clear_cache(self):
        """Clear all cached models"""
        self.model_cache.clear()
        self.tokenizer_cache.clear()
        logger.info("Cleared all model cache")