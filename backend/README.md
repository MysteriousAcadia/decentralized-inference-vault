# DIV Inference Backend

A Python backend service for the Decentralized Inference Vault (DIV) platform that handles:

- User access validation through smart contract token balance checking
- Model file download and decryption from Lighthouse storage
- AI model inference processing
- Commission-free payment validation

## Features

- **Token-Gated Access**: Validates user access through ERC-20 token balances
- **Encrypted Storage**: Downloads and decrypts models from Lighthouse/IPFS
- **Multi-Model Support**: Supports PyTorch, Pickle, and Hugging Face models
- **Caching**: Intelligent caching for models and downloaded files
- **REST API**: FastAPI-based endpoints for model management and inference

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js (for Lighthouse integration)
- Docker (optional)

### Installation

1. Clone the repository and navigate to backend:

```bash
git clone <repo>
cd backend
```

2. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Setup environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the server:

```bash
cd src
python main.py
```

The server will start at `http://localhost:8000`

### Docker Deployment

1. Build and run with Docker Compose:

```bash
docker-compose up --build
```

## API Endpoints

### Health Check

- `GET /health` - Service health status

### Model Management

- `POST /api/v1/models/load` - Load a model for inference
- `GET /api/v1/models` - List loaded models
- `GET /api/v1/models/{model_id}` - Get model info
- `DELETE /api/v1/models/{model_id}` - Unload model

### Inference

- `POST /api/v1/inference` - Run inference on loaded model
- `POST /api/v1/inference/run` - Load model and run inference

### Cache Management

- `DELETE /api/v1/cache` - Clear all caches

## Configuration

Key environment variables:

```bash
# Lighthouse Integration
LIGHTHOUSE_API_KEY=your_api_key

# Blockchain Connection
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your_key
VAULT_CONTRACT_ADDRESS=0x123...
USDC_CONTRACT_ADDRESS=0x456...

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Model Configuration
MODEL_CACHE_DIR=./cache/models
MAX_MODEL_SIZE_MB=1000
INFERENCE_TIMEOUT_SECONDS=30
```

## Usage Example

### 1. Load a Model

```python
import requests

load_request = {
    "model_id": "my-model-1",
    "user_address": "0x742d35Cc6634C0532925a3b8D75C0B08D4603c0C",
    "cid": "QmYourModelCIDHere",
    "decryption_key": "your_decryption_key",
    "user_signature": "0x..."
}

response = requests.post(
    "http://localhost:8000/api/v1/models/load",
    json=load_request
)
print(response.json())
```

### 2. Run Inference

```python
inference_request = {
    "model_id": "my-model-1",
    "user_address": "0x742d35Cc6634C0532925a3b8D75C0B08D4603c0C",
    "input_data": {
        "text": "Hello, world!"
    },
    "user_signature": "0x..."
}

response = requests.post(
    "http://localhost:8000/api/v1/inference",
    json=inference_request
)
print(response.json())
```

## Architecture

The backend consists of several key components:

- **AccessValidator**: Validates user token ownership via smart contracts
- **LighthouseClient**: Handles file download and decryption from IPFS
- **InferenceEngine**: Manages model loading and inference processing
- **FastAPI Server**: Provides REST API endpoints

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black src/
flake8 src/
```

### Adding New Model Types

1. Extend `InferenceEngine._load_model_content()` method
2. Add corresponding inference method
3. Update input validation logic

## Security Considerations

- All user addresses are validated before processing
- Model files are cached securely with proper cleanup
- Access control is enforced through blockchain token ownership
- Inference timeout prevents resource exhaustion

## Troubleshooting

### Common Issues

1. **Model loading fails**: Check CID validity and Lighthouse connectivity
2. **Access denied**: Verify user has sufficient token balance
3. **Inference timeout**: Reduce model size or increase timeout setting
4. **Out of memory**: Increase available RAM or reduce concurrent models

### Logs

Check application logs for detailed error information:

```bash
tail -f logs/div-backend.log
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details.
