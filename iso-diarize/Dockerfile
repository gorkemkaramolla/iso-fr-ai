# sudo docker compose -f docker-compose-gpu.yaml build --no-cache# # Use an official Python runtime as a parent image with PyTorch, CUDA, and cuDNN
# FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

# # Install dependencies
# RUN apt-get update && apt-get install -y \
#     libgomp1 \
#     ffmpeg \
#     && rm -rf /var/lib/apt/lists/*

# # Set the working directory in the container
# WORKDIR /app

# # Copy the current directory contents into the container at /app
# COPY . /app

# # Install any needed packages specified in requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt

# # Make port 5003 available to the world outside this container
# EXPOSE 5003

# # Run the application with Gunicorn when the container launches
# CMD ["gunicorn", "--worker-class", "eventlet", "--bind", "0.0.0.0:5003", "app:app"]
# Use an official Python runtime as a parent image
FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

# Install dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    ffmpeg wget \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
# COPY . /app

# Create the directory and download the files
RUN mkdir -p /app/services/large-v3 && \
    wget -O /app/services/large-v3/model.bin "https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/model.bin?download=true" && \
    wget -O /app/services/large-v3/.gitattributes "https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/.gitattributes?download=true" && \
    wget -O /app/services/large-v3/README.md "https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/README.md?download=true" && \
    wget -O /app/services/large-v3/config.json "https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/config.json?download=true" && \
    wget -O /app/services/large-v3/preprocessor_config.json "https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/preprocessor_config.json?download=true" && \
    wget -O /app/services/large-v3/tokenizer.json "https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/tokenizer.json?download=true" && \
    wget -O /app/services/large-v3/vocabulary.json "https://huggingface.co/Systran/faster-whisper-large-v3/resolve/main/vocabulary.json?download=true" && \
    chmod -R 777 /app/services/large-v3 && \
    echo "Listing contents of the model directory:" && \
    ls -la /app/services/large-v3

COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt

# Make port 5003 available to the world outside this container
EXPOSE 5003

# Run app.py when the container launches
CMD ["python", "app.py"]
