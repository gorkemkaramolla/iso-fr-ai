# Use an official NVIDIA CUDA runtime as a parent image
FROM nvidia/cuda:11.8.0-runtime-ubuntu20.04

# Set the working directory in the container
WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin

# Install system dependencies in one layer and clean up afterwards to reduce layer size
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg libsm6 libxext6 build-essential gcc libssl-dev libffi-dev unzip wget libgomp1 software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y python3.12 python3.12-venv python3.12-dev python3.12-distutils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install pip for Python 3.12
RUN wget https://bootstrap.pypa.io/get-pip.py && \
    python3.12 get-pip.py && \
    rm get-pip.py

# Update alternatives to set python3.12 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1 && \
    update-alternatives --install /usr/bin/pip3 pip3 /usr/local/bin/pip3.12 1

# Install certifi and other required packages
RUN python3.12 -m pip install --upgrade pip certifi six setuptools

# Copy the current directory contents into the container at /app
COPY . /app

# Ensure CUDA libraries are installed
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libcublas-11-0 libcusparse-11-0 libcudnn8=8.0.5.39-1+cuda11.1 libcublas-dev-11-0 libcusparse-dev-11-0 libcudnn8-dev=8.0.5.39-1+cuda11.1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Update pip and install Python dependencies from the requirements.txt file
RUN python3.12 -m pip install --upgrade pip && \
    python3.12 -m pip install --no-cache-dir -r requirements.txt

# Install transformers with the --use-feature=truststore option
RUN python3.12 -m pip install transformers --use-feature=truststore

# Inform Docker that the container listens on the specified port at runtime
EXPOSE 5003

# Run app.py when the container launches
CMD ["python3", "app.py"]
