#!/bin/bash

# Create the directory for the buffalo_l model
mkdir -p ./services/models/buffalo_l

# Download the buffalo_l model zip file
wget -O ./services/models/buffalo_l/buffalo_l.zip "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip"

# Unzip the buffalo_l model
unzip ./services/models/buffalo_l/buffalo_l.zip -d ./services/models/buffalo_l

# Remove the downloaded zip file
rm ./services/models/buffalo_l/buffalo_l.zip

# Download the emotion model in ONNX format
wget -O ./services/models/buffalo_l/emotion_model.onnx "https://github.com/shangeth/Facial-Emotion-Recognition-PyTorch-ONNX/raw/master/ONNX/models/onnx_model.onnx"

# Set permissions for the buffalo_l directory and its contents
chmod -R 777 ./services/models/buffalo_l

# List the contents of the buffalo_l directory
echo "Listing contents of the model directory:"
ls -la ./services/models/buffalo_l
