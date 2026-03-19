import os
import json
import re
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq
from knowledge_base import SYSTEM_PROMPT

# ======================== CONFIG ========================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "llama-3.3-70b-versatile"
# ========================================================

app = Flask(__name__)
CORS(app)

# Configure Groq
client = Groq(api_key=GROQ_API_KEY)

# Store conversation histories per session (simple in-memory)
conversations = {}


def extract_json_from_response(text):
    """Extract JSON from LLM response text."""
    # Try to find JSON block in markdown code fence
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try to parse entire response as JSON
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in text
    json_match = re.search(r'\{[^{}]*"classification"[^{}]*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    return None


@app.route('/')
def index():
    """Serve the chatbot web page."""
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages."""
    data = request.get_json()
    user_message = data.get('message', '').strip()
    session_id = data.get('session_id', 'default')

    if not user_message:
        return jsonify({'error': 'Empty message'}), 400

    try:
        # Get or create conversation for this session
        if session_id not in conversations:
            conversations[session_id] = [
                {"role": "system", "content": SYSTEM_PROMPT}
            ]

        chat_history = conversations[session_id]
        
        # Add user message to history
        chat_history.append({"role": "user", "content": user_message})

        # Send message to Groq
        response = client.chat.completions.create(
            messages=chat_history,
            model=MODEL_NAME,
            temperature=0.1, # Low temperature for consistent classification
            max_completion_tokens=500
        )
        
        response_text = response.choices[0].message.content
        
        # Add assistant response to history
        chat_history.append({"role": "assistant", "content": response_text})

        # Try to extract classification JSON
        classification_data = extract_json_from_response(response_text)

        if classification_data and 'classification' in classification_data:
            return jsonify({
                'type': 'classification',
                'classification': classification_data.get('classification', 'UNKNOWN'),
                'confidence': classification_data.get('confidence', 0),
                'explanation': classification_data.get('explanation', ''),
                'raw_response': response_text
            })
        else:
            return jsonify({
                'type': 'chat',
                'message': response_text
            })

    except Exception as e:
        return jsonify({
            'type': 'error',
            'message': f'Xin lỗi, đã có lỗi xảy ra: {str(e)}'
        }), 500


@app.route('/api/reset', methods=['POST'])
def reset():
    """Reset conversation history."""
    data = request.get_json()
    session_id = data.get('session_id', 'default')

    if session_id in conversations:
        del conversations[session_id]

    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
