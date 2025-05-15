from flask import Flask, render_template, request, jsonify
import openai
import requests

app = Flask(__name__)

openai.api_key = "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"  # ★OpenAIのAPIキー

VOICEVOX_URL = "http://127.0.0.1:50021"
SPEAKER_ID = 1

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json["message"]

    messages = [
        {"role": "system", "content": "あなたは日記を書くのを手伝う優しいAIアシスタントです。"},
        {"role": "user", "content": user_input}
    ]

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages
    )
    reply = response.choices[0].message["content"]

    return jsonify({"reply": reply})

@app.route("/voice", methods=["POST"])
def voice():
    text = request.json["text"]

    # VOICEVOX audio_query
    r1 = requests.post(f"{VOICEVOX_URL}/audio_query", params={"text": text, "speaker": SPEAKER_ID})
    if r1.status_code != 200:
        return jsonify({"error": "VOICEVOX audio_query failed"}), 500

    # VOICEVOX synthesis
    r2 = requests.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": SPEAKER_ID},
        headers={"Content-Type": "application/json"},
        data=r1.text
    )
    if r2.status_code != 200:
        return jsonify({"error": "VOICEVOX synthesis failed"}), 500

    # 音声ファイルを返す
    with open("static/output.wav", "wb") as f:
        f.write(r2.content)

    return jsonify({"voiceUrl": "/static/output.wav"})

if __name__ == "__main__":
    app.run(debug=True)
