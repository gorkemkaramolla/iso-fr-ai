# Use an official Python runtime as a parent image
FROM python:3.12.2-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Docker CLI using the official Docker installation script
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh get-docker.sh

# Make port 5004 available to the world outside this container
EXPOSE 5004

# Run Gunicorn with Gevent when the container launches
CMD ["gunicorn", "--worker-class", "gevent", "-w", "3", "-b", "0.0.0.0:5004", "app:app"]
