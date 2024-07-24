# Use an official Python runtime as a parent image
FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

# Install dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 5003 available to the world outside this container
EXPOSE 5003

# Run app.py when the container launches
CMD ["python", "app.py"]