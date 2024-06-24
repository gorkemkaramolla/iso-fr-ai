# Use the official Python image from the Docker Hub
FROM python:3.12.3-slim

# Set the working directory in the container
WORKDIR /

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libffi-dev \
    libssl-dev \
    ffmpeg \
    && apt-get clean
# Copy the requirements.txt file into the container
COPY requirements.txt /

# Install the dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application code into the container
COPY . /

# Set the environment variables for Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Expose the port that the app runs on
EXPOSE 5000

# Run the application
CMD ["flask", "run"]