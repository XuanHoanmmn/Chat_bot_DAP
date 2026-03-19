# Vietnamese Hate Speech Detection - RAG Chatbot

Chatbot nhận diện ngôn ngữ thù ghét tiếng Việt sử dụng Gemini AI + RAG, dựa trên nghiên cứu PhoBERT-CNN-BiLSTM.

## Chạy local

```bash
pip install -r requirements.txt
python app.py
```

Mở trình duyệt: http://localhost:5000

## Deploy lên Render.com (có link public)

1. **Tạo GitHub repo** cho folder `CHATBOT/`:
   ```bash
   cd CHATBOT
   git init
   git add .
   git commit -m "Initial commit - HateSpeech Chatbot"
   ```

2. **Push lên GitHub**:
   - Tạo repo mới trên https://github.com/new
   - Push code lên

3. **Deploy trên Render.com**:
   - Vào https://render.com → Sign up (miễn phí)
   - Click **New** → **Web Service**
   - Kết nối GitHub repo
   - Render sẽ tự đọc `render.yaml` và deploy
   - Sau vài phút sẽ có link dạng: `https://hatespeech-chatbot.onrender.com`

4. **Gửi link cho giáo viên** 🎉
