import sys
import os
import re
import json
import subprocess
import urllib.request

LOCAL_AI_URL = "http://localhost:8080/v1/chat/completions"

SYSTEM_PROMPT = """
You are an autonomous lead software engineer working on Project Verdika.
You must adhere to zero-dependency JavaScript (ES6+), HTML5 Canvas, and modular clean code standards.

CRITICAL INSTRUCTIONS:
1. When asked to fix a bug or add a feature, you MUST provide FULL, COMPLETE code files. 
2. NEVER use placeholders, comments like "// ... rest of code ...", or partial diffs. 
3. Format EVERY updated file using this exact header pattern so the parsing system can write it to disk:

=== FILE: path/to/file ===

[FULL SOURCE CODE HERE]
"""

def call_local_ai(user_prompt):
    print("🤖 Sending task to local AI agent...")
    payload = {
        "model": "qwen2.5-coder-3b",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2
    }
    req = urllib.request.Request(
        LOCAL_AI_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data['choices'][0]['message']['content']
    except Exception as e:
        print(f"❌ Error communicating with local AI server: {e}")
        sys.exit(1)

def apply_code_changes(response_text):
    pattern = r"===\s*FILE:\s*([^\s=]+)\s*===\s*(?:\w+)?\n(.*?)"
    matches = re.findall(pattern, response_text, re.DOTALL)
    
    if not matches:
        print("⚠️ No direct file rewrites detected in AI response. Raw output:\n")
        print(response_text)
        return []
        
    modified_files = []
    for filepath, content in matches:
        filepath = filepath.strip()
        dir_name = os.path.dirname(filepath)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
            
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")
            
        print(f"✅ Successfully updated: {filepath}")
        modified_files.append(filepath)
        
    return modified_files

def run_git_pipeline(prompt_summary, modified_files):
    if not modified_files:
        print("ℹ️ Skipping Git push (no files were modified).")
        return
        
    print("\n📦 Running Git deployment pipeline...")
    clean_msg = prompt_summary.replace('"', '').replace("'", "")[:60]
    commit_msg = f"auto-fix: {clean_msg}"
    
    try:
        subprocess.run(["git", "add"] + modified_files, check=True)
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        print(f"📌 Committed changes: '{commit_msg}'")
        
        tag_name = f"build-{int(subprocess.check_output(['date', '+%s']))}"
        subprocess.run(["git", "tag", tag_name], check=True)
        print(f"🏷️ Created Version Tag: {tag_name}")
        
        print("🚀 Pushing live to GitHub Pages...")
        subprocess.run(["git", "push", "origin", "HEAD", "--tags"], check=True)
        print("🎉 Deployment complete! Live application updated.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Git execution failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python3 agent.py "<prompt_text>"')
        sys.exit(1)
        
    user_prompt = sys.argv[1]
    ai_response = call_local_ai(user_prompt)
    updated_files = apply_code_changes(ai_response)
    run_git_pipeline(user_prompt, updated_files)
