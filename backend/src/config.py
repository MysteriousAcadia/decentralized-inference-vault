"""
Configuration module for DIV backend
"""

import os
from typing import Optional
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings"""
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Lighthouse Configuration
    lighthouse_api_key: Optional[str] = Field(default=None, env="LIGHTHOUSE_API_KEY")
    lighthouse_base_url: str = Field(default="https://node.lighthouse.storage", env="LIGHTHOUSE_BASE_URL")
    
    # Blockchain Configuration
    web3_provider_url: Optional[str] = Field(default=None, env="WEB3_PROVIDER_URL")
    vault_contract_address: Optional[str] = Field(default=None, env="VAULT_CONTRACT_ADDRESS")
    usdc_contract_address: Optional[str] = Field(default=None, env="USDC_CONTRACT_ADDRESS")
    
    # Model Configuration
    model_cache_dir: str = Field(default="./cache/models", env="MODEL_CACHE_DIR")
    max_model_size_mb: int = Field(default=1000, env="MAX_MODEL_SIZE_MB")
    inference_timeout_seconds: int = Field(default=30, env="INFERENCE_TIMEOUT_SECONDS")
    
    # Security Configuration
    max_concurrent_inferences: int = Field(default=10, env="MAX_CONCURRENT_INFERENCES")
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings"""
    return settings