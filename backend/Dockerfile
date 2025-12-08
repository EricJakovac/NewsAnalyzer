FROM python:3.10-slim

WORKDIR /app

# Kopiraj requirements prvo (za bolje caching)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "app.py"]