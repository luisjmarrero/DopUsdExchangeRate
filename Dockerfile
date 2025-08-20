
# Builder pattern for smaller, faster builds
FROM python:3.11-slim AS builder
WORKDIR /install
COPY requirements.txt .
# Install Chrome for Selenium scraping
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /usr/src/app
# Install Chrome for Selenium scraping
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
COPY scripts ./scripts
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
