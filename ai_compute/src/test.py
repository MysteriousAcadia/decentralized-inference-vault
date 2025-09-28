# Model snapshotting test - Single file snapshot
import os
import pickle
import tempfile
import shutil
from transformers import AutoTokenizer, AutoModelForCausalLM

# Define snapshot file
snapshot_dir = "../cache/snapshots"
model_name = "Qwen/Qwen2.5-0.5B"
snapshot_file = os.path.join(snapshot_dir, "qwen_0_5b_snapshot.pkl")

def save_model_snapshot(model, tokenizer, snapshot_file):
    """Save model and tokenizer as a single pickle file"""
    os.makedirs(os.path.dirname(snapshot_file), exist_ok=True)
    
    # Create temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save model and tokenizer to temp directory
        model.save_pretrained(temp_dir)
        tokenizer.save_pretrained(temp_dir)
        
        # Create snapshot data
        snapshot_data = {
            'model_name': model_name,
            'model_config': model.config.to_dict(),
            'model_state_dict': model.state_dict(),
            'tokenizer_config': tokenizer.get_vocab(),
            'tokenizer_files': {}
        }
        
        # Read tokenizer files
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path) and any(filename.endswith(ext) for ext in ['.json', '.txt', '.model']):
                with open(file_path, 'rb') as f:
                    snapshot_data['tokenizer_files'][filename] = f.read()
        
        # Save as single pickle file
        with open(snapshot_file, 'wb') as f:
            pickle.dump(snapshot_data, f, protocol=pickle.HIGHEST_PROTOCOL)
        
        file_size_mb = os.path.getsize(snapshot_file) / (1024 * 1024)
        print(f"Model snapshot saved to {snapshot_file} ({file_size_mb:.2f}MB)")

def load_model_snapshot(snapshot_file):
    """Load model and tokenizer from single pickle file"""
    if not os.path.exists(snapshot_file):
        return None, None
    
    try:
        print(f"Loading model from snapshot: {snapshot_file}")
        
        # Load snapshot data
        with open(snapshot_file, 'rb') as f:
            snapshot_data = pickle.load(f)
        
        # Create temporary directory to reconstruct model files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Restore tokenizer files
            for filename, content in snapshot_data['tokenizer_files'].items():
                file_path = os.path.join(temp_dir, filename)
                with open(file_path, 'wb') as f:
                    f.write(content)
            
            # Load tokenizer from reconstructed files
            tokenizer = AutoTokenizer.from_pretrained(temp_dir)
            
            # Create model with config and load state dict
            from transformers import AutoConfig
            config = AutoConfig.from_dict(snapshot_data['model_config'])
            model = AutoModelForCausalLM.from_config(config)
            model.load_state_dict(snapshot_data['model_state_dict'])
            
            file_size_mb = os.path.getsize(snapshot_file) / (1024 * 1024)
            print(f"Model loaded from snapshot ({file_size_mb:.2f}MB)")
            return model, tokenizer
            
    except Exception as e:
        print(f"Error loading snapshot: {e}")
        return None, None

def delete_model_snapshot(snapshot_file):
    """Delete the snapshot file"""
    if os.path.exists(snapshot_file):
        os.remove(snapshot_file)
        print(f"Snapshot deleted: {snapshot_file}")
        return True
    return False

def run_inference(model, tokenizer):
    """Run inference with the model"""
    messages = [
        {"role": "user", "content": "Who are you?"},
    ]
    inputs = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    ).to(model.device)

    outputs = model.generate(**inputs, max_new_tokens=40)
    response = tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:])
    return response

# Main execution
print("=== Single File Model Snapshotting Test ===")

# Try to load from snapshot first
model, tokenizer = load_model_snapshot(snapshot_file)

if model is None or tokenizer is None:
    print("No snapshot found. Loading model from HuggingFace...")
    model_name='"Qwen/Qwen2.5-0.5B"';
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Save snapshot for next time
    print("Saving model snapshot...")
    save_model_snapshot(model, tokenizer, snapshot_file)
else:
    print("Successfully loaded model from snapshot!")

# Run inference
print("\nRunning inference...")
response = run_inference(model, tokenizer)
print(f"Model response: {response}")

print(f"\nSnapshot location: {os.path.abspath(snapshot_file)}")
print("Next time you run this script, it will load from the snapshot!")

# Optional: Demonstrate snapshot deletion
print("\nTo delete snapshot, uncomment the next line:")
print("# delete_model_snapshot(snapshot_file)")