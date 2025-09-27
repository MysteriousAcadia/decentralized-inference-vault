# 🧠 Decentralized Inference Vault (DIV): Data DAO Edition

## 🌟 Project Goal

DIV is now a **Commission-Free, Token-Gated Model-as-a-Service (MaaS) Inference Platform**.

It enables model owners to wrap their pre-trained AI models into a **Data DAO** structure using Lighthouse. Access to the encrypted model file and the right to use the inference service are token-gated. The entire payment flow is **peer-to-peer** (User to Model Owner/DAO) using Synapse/USDFC, eliminating platform commissions.

## 🎯 Target Sponsor Tracks

1.  **Lighthouse & Data DAOs:** **Encrypted storage** of the AI model file and **token-gated access** to the decryption key, forming the Data DAO primitive.
2.  **Filecoin & Synapse SDK:** **Commission-Free, USDFC-based micro-payment rail** for inference usage (Peer-to-Peer settlement).
3.  **Fluence Virtual Servers (CPU-only):** The **cloudless compute engine** that performs the inference on the decrypted model.

## 🛠️ High-Level Architecture

The system now operates as a secure, decentralized pipeline:

1.  **The Vault (Lighthouse/Filecoin):** Encrypts the model file, and the decryption key is only released if a wallet holds the DAO/Access Token.
2.  **The Engine (Fluence VM):** Loads the encrypted model, requests the key from Lighthouse (via the user's signed message/token), decrypts the model, and runs the inference.
3.  **The Ledger (Solidity/Synapse):** Manages the **Model Access Token (The DAO Primitive)** and facilitates the direct micro-payment from User to Model Owner/DAO treasury.

---

## 💻 Technical Implementation & Folder Structure (UPDATED)

We will update the folder structure to reflect the shift to Lighthouse.

```
/div-project
├── /01-smart-contracts         # Solidity/Synapse/ERC-20 logic
│   ├── ModelAccessToken.sol     # ERC-20/ERC-721 for DAO membership
│   ├── ModelVault.sol           # Model metadata, token mapping, and pricing
│   └── PaymentStream.sol        # Synapse/USDFC logic (no commission)
|
├── /02-model-service          # The Fluence VM API
│   ├── Dockerfile
│   ├── app.py                 # Flask/FastAPI for inference + Lighthouse fetch/decrypt
│   └── requirements.txt
|
├── /03-model-uploader-cli     # Node.js tool for Model Owners/Data DAOs
│   ├── index.js               # CLI logic for encrypt, upload, register, token-gate
│   └── config.js
|
└── /04-frontend-dapp          # Next.js/React App for Users
    ├── components/
    └── pages/
```

---

## ⚙️ Required Implementations (UPDATED)

### 1\. Smart Contracts & Data DAO Primitive

| Implementation             | Description                                                                                                                                                 | Lighthouse/Synapse Integration                                                                                                                                          |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ModelAccessToken.sol`** | An **ERC-20/ERC-721** token that represents membership in the Model DAO. This is the **tokenized data primitive**. The Model Owner is the DAO/Token Issuer. | **Lighthouse Access Control:** The token contract address and a minimum token balance are set as the **access condition** when encrypting the model file on Lighthouse. |
| **`ModelVault.sol`**       | Stores metadata: `[Model ID] -> {CID, Token Contract Address, Price Per Inference (USDFC)}`.                                                                | N/A                                                                                                                                                                     |
| **`PaymentStream.sol`**    | Handles user deposits and _direct_ settlement to the Model Owner/DAO treasury address. **Crucially, the platform takes 0% commission.**                     | **Synapse SDK:** Used for USDFC deposit and **P2P micro-payment** settlement between the User and the DAO treasury address on every inference.                          |

**🔗 Docs to Utilize:**

- **Lighthouse Access Control:** Use **ERC20/ERC721** condition for file access. (Search for `Lighthouse Encryption & Access Control` on Google)
- **Synapse SDK:** `PaymentsService` for deposit and direct settlement (P2P).

### 2\. Model Uploader CLI (Data DAO Workflow)

| Implementation                  | Description                                                                                                                                                 | Lighthouse Integration                                                                                                              |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Lighthouse Model Encryption** | CLI tool takes the model file, encrypts it using the user's wallet key via **Lighthouse's Kavach SDK**.                                                     | **Lighthouse SDK (Kavach):** Use the SDK to encrypt the model file _before_ upload.                                                 |
| **Lighthouse Access Gating**    | Set the access condition on the encrypted file: Only wallets holding **\> 0** of the newly deployed `ModelAccessToken.sol` can retrieve the decryption key. | **Lighthouse SDK:** Use the `setAccessConditions` function, specifying the token contract address, chain, and minimum token amount. |
| **Lighthouse Model Upload**     | Uploads the now-encrypted model file to Lighthouse/Filecoin and receives the **CID**.                                                                       | **Lighthouse SDK:** Standard upload method.                                                                                         |
| **On-Chain Registration**       | Deploys the `ModelAccessToken.sol`, then registers the **CID, Token Address, and Price** on the `ModelVault.sol` contract.                                  | Synapse SDK for transaction submission.                                                                                             |

**🔗 Docs to Utilize:**

- **Lighthouse SDK:** Encryption, upload, and setting access conditions. (Search for `Lighthouse Encryption SDK setAccessConditions`)

### 3\. Model Inference Service (The Engine)

| Implementation                 | Description                                                                                                                                                                                                                              | Fluence/Lighthouse Integration                                                                                                                                   |
| :----------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lighthouse Key Retrieval**   | The Fluence VM receives the inference request, which includes the **User's Wallet Signature** (proof of token ownership). The VM uses this signature to request the **decryption key** from Lighthouse's nodes.                          | **Lighthouse SDK:** Use the `getDecryptionKey` method, passing the user's signed message, which is validated by Lighthouse against the on-chain token condition. |
| **Model Decryption & Load**    | On receiving the key, the VM decrypts the Lighthouse-encrypted file locally in memory (or a temporary disk) and loads the CPU-optimized model.                                                                                           | **Python/Kavach SDK:** Integrate the Lighthouse decryption logic into the Fluence VM's Python application.                                                       |
| **Inference & Metering**       | Runs the inference and calculates the usage unit.                                                                                                                                                                                        | Fluence VM environment.                                                                                                                                          |
| **Commission-Free Settlement** | After success, the Model Owner's address (pre-funded for gas) sends a transaction via Synapse SDK to the `PaymentStream` contract, executing the **direct USDFC micro-payment** from the User's deposit to the Model Owner/DAO Treasury. | **Synapse SDK:** Direct `PaymentStream` execution. The _lack of a platform middleman_ makes it commission-free.                                                  |
