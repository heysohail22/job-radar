FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 HOST=0.0.0.0 AUTH_MODE=owner PORT=3001
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --require-hashes -r requirements.txt && useradd --create-home radar
COPY --chown=radar:radar job_radar ./job_radar
USER radar
EXPOSE 3001
CMD ["python", "-m", "job_radar"]
