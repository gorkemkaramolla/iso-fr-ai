# Use an official Python runtime as a parent image
FROM python:3.12.4-slim

# Set the working directory inside the container
WORKDIR /app

# Environment variables to avoid interactive prompts and set the timezone
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin

# Install system dependencies in one layer, clean up afterwards to reduce image size
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg libsm6 libxext6 build-essential gcc libssl-dev libffi-dev unzip wget libgomp1 software-properties-common && \
    apt-get update && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
# Install Python dependencies and ensure that certifi and pip are updated
RUN python3 -m pip install --upgrade pip certifi six

# If you need to download and set up models, uncomment the following lines
# RUN mkdir -p /app/services/models/buffalo_l && \
#     wget -O /app/services/models/buffalo_l/buffalo_l.zip "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
#     unzip /app/services/models/buffalo_l/buffalo_l.zip -d /app/services/models/buffalo_l && \
#     rm /app/services/models/buffalo_l/buffalo_l.zip && \
#     wget -O /app/services/models/buffalo_l/emotion_model.onnx "https://github.com/shangeth/Facial-Emotion-Recognition-PyTorch-ONNX/raw/master/ONNX/models/onnx_model.onnx" && \
#     echo "Listing contents of the model directory:" && \
#     ls -la /app/services/models/buffalo_l

# COPY ~/.insightface/models/buffalo_l/ /app/services/models/buffalo_l/

# Copy the current directory contents into the container at /app
COPY . /app

# Install Python dependencies from requirements.txt
RUN python3 -m pip install --upgrade pip && \
    pip3 install -r requirements.txt

# Inform Docker that the container listens on port 5002
EXPOSE 5002

# Define the command to run the application
CMD ["python3", "app.py"]


# FROM python:3.12.4-slim

# # Set the working directory inside the container
# WORKDIR /app
# ENV DEBIAN_FRONTEND=noninteractive
# ENV TZ=Europe/Berlin

# # Install system dependencies in one layer and clean up afterwards to reduce layer size
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends \
#     ffmpeg libsm6 libxext6 build-essential gcc libssl-dev libffi-dev python3-dev python3-pip unzip wget curl ca-certificates && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# # Install certifi and other required packages
# RUN python3 -m pip install --upgrade pip certifi six

# # Prepare the models directory within the /app directory and download model files
# # RUN mkdir -p /app/services/models/buffalo_l && \
# #     wget -O /app/services/models/buffalo_l/buffalo_l.zip "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
# #     unzip /app/services/models/buffalo_l/buffalo_l.zip -d /app/services/models/buffalo_l && \
# #     rm /app/services/models/buffalo_l/buffalo_l.zip && \
# #     wget -O /app/services/models/buffalo_l/emotion_model.onnx "https://github.com/shangeth/Facial-Emotion-Recognition-PyTorch-ONNX/raw/master/ONNX/models/onnx_model.onnx" && \
# #     echo "Listing contents of the model directory:" && \
# #     ls -la /app/services/models/buffalo_l

# # COPY ~/.insightface/models/buffalo_l/ /app/services/models/buffalo_l/

# # Copy the local directory contents to the container's working directory
# COPY . /app

# # Update pip and install Python dependencies from the requirements.txt file
# RUN python3 -m pip install --upgrade pip && \
#     pip3 install -r requirements.txt

# # Install certificates
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     openssl ca-certificates && \
#     update-ca-certificates

# # Ensure Python uses the correct certificates
# ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

# # Inform Docker that the container listens on the specified port at runtime
# EXPOSE 5002

# # Command to run the application
# CMD ["python3", "app.py"]
