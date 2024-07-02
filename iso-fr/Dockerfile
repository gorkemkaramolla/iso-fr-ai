# Use a specific version of the Python image
FROM python:3.12.2-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies in one layer and clean up afterwards to reduce layer size
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg libsm6 libxext6 build-essential gcc libssl-dev libffi-dev python3-dev unzip wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Prepare the models directory within the /app directory and download model files
RUN mkdir -p /app/services/models && \
    wget -O /app/services/models/buffalo_l.zip "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" && \
    unzip /app/services/models/buffalo_l.zip -d /app/services/models && \
    rm /app/services/models/buffalo_l.zip && \
    echo "Listing contents of the model directory:" && \
    ls -la /app/services/models/

# Copy the local directory contents to the container's working directory
COPY . /app

# Update pip and Install Python dependencies from the requirements.txt file
RUN pip install --no-cache-dir -r requirements.txt

# Inform Docker that the container listens on the specified port at runtime
EXPOSE 5002

# Command to run the application
CMD ["python", "app.py"]
