"""
Access control module for validating user permissions to access models
"""

from typing import Optional
import os
from web3 import Web3
from web3.contract import Contract
import logging

logger = logging.getLogger(__name__)


class AccessValidator:
    """Validates user access to models through token balance checking"""
    
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER_URL')))
        self.vault_contract_address = os.getenv('VAULT_CONTRACT_ADDRESS')
        
        # Basic ERC20 ABI for balance checking
        self.erc20_abi = [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            }
        ]
        
        # Basic ModelVault ABI for getting model info
        self.vault_abi = [
            {
                "constant": True,
                "inputs": [{"name": "modelId", "type": "bytes32"}],
                "name": "getModelInfo",
                "outputs": [
                    {"name": "cid", "type": "string"},
                    {"name": "tokenContract", "type": "address"},
                    {"name": "pricePerInference", "type": "uint256"},
                    {"name": "owner", "type": "address"},
                    {"name": "active", "type": "bool"},
                    {"name": "totalInferences", "type": "uint256"}
                ],
                "type": "function"
            }
        ]
        
    async def validate_user_access(self, user_address: str, model_id: str) -> dict:
        """
        Validate if user has access to the specified model
        
        Args:
            user_address: Ethereum address of the user
            model_id: Model identifier (will be converted to bytes32)
            
        Returns:
            dict: Validation result with access status and model info
        """
        try:
            # Check if addresses are valid
            if not self.web3.is_address(user_address):
                return {
                    "has_access": False,
                    "error": "Invalid user address"
                }
            
            # Convert model_id to bytes32
            model_id_bytes = self.web3.keccak(text=model_id)
            
            # Get model info from vault contract
            vault_contract = self.web3.eth.contract(
                address=self.vault_contract_address,
                abi=self.vault_abi
            )
            
            try:
                model_info = vault_contract.functions.getModelInfo(model_id_bytes).call()
                cid, token_contract, price_per_inference, owner, active, total_inferences = model_info
                
                if not active:
                    return {
                        "has_access": False,
                        "error": "Model is not active",
                        "model_info": {
                            "cid": cid,
                            "active": active,
                            "owner": owner
                        }
                    }
                
                # Check user's token balance
                token_contract_instance = self.web3.eth.contract(
                    address=token_contract,
                    abi=self.erc20_abi
                )
                
                user_balance = token_contract_instance.functions.balanceOf(user_address).call()
                
                # For simplicity, require at least 1 token for access
                # In production, this threshold should be configurable per model
                min_balance_required = 1 * (10 ** 18)  # 1 token (assuming 18 decimals)
                
                has_access = user_balance >= min_balance_required
                
                return {
                    "has_access": has_access,
                    "user_balance": user_balance,
                    "min_balance_required": min_balance_required,
                    "model_info": {
                        "cid": cid,
                        "token_contract": token_contract,
                        "price_per_inference": price_per_inference,
                        "owner": owner,
                        "active": active,
                        "total_inferences": total_inferences
                    }
                }
                
            except Exception as e:
                logger.error(f"Error getting model info: {e}")
                return {
                    "has_access": False,
                    "error": f"Model not found or contract error: {str(e)}"
                }
                
        except Exception as e:
            logger.error(f"Access validation error: {e}")
            return {
                "has_access": False,
                "error": f"Validation error: {str(e)}"
            }
    
    async def validate_payment(self, user_address: str, model_id: str, payment_amount: int) -> bool:
        """
        Validate if payment amount is sufficient for inference
        
        Args:
            user_address: User's ethereum address
            model_id: Model identifier
            payment_amount: Payment amount in wei
            
        Returns:
            bool: True if payment is sufficient
        """
        try:
            access_result = await self.validate_user_access(user_address, model_id)
            
            if not access_result["has_access"]:
                return False
                
            model_info = access_result["model_info"]
            return payment_amount >= model_info["price_per_inference"]
            
        except Exception as e:
            logger.error(f"Payment validation error: {e}")
            return False