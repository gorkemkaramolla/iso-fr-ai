import docker
import psutil
import subprocess
from docker.errors import DockerException
import time

class SystemMonitoring:
    def __init__(self):
        self.client = self.initialize_docker_client()

    def initialize_docker_client(self):
        try:
            client = docker.from_env()
            client.ping()  # Check if the Docker daemon is responsive
            return client
        except DockerException as e:
            print(f"Failed to connect to Docker daemon: {e}")
            return None

    def get_host_cpu_usage(self):
        return f"{psutil.cpu_percent()}%"

    def get_host_memory_usage(self):
        mem = psutil.virtual_memory()
        return f"{mem.used / (1024 ** 3):.2f}GB/{mem.total / (1024 ** 3):.2f}GB"

    def get_host_gpu_stats(self):
        try:
            result = subprocess.run(['nvidia-smi', '--query-gpu=temperature.gpu,utilization.gpu', '--format=csv,noheader,nounits'], capture_output=True, text=True)
            temp, usage = result.stdout.strip().split(', ')
            return f"{usage}%", f"{temp}C"
        except Exception:
            return 'N/A', 'N/A'

    def get_host_cpu_temp(self):
        try:
            temp = psutil.sensors_temperatures()['coretemp'][0].current
            return f"{temp:.1f}C"
        except Exception:
            return 'N/A'

    def get_container_stats(self):
        container_metrics = []
        if not self.client:
            return container_metrics

        try:
            for container in self.client.containers.list():
                stats = container.stats(stream=False)
                container_name = container.name

                # Calculate CPU usage
                cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
                system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
                if system_delta > 0:
                    cpu_percent = (cpu_delta / system_delta) * stats["cpu_stats"]["online_cpus"] * 100
                else:
                    cpu_percent = 0
                cpu_percent = round(cpu_percent, 2)

                # Get memory usage
                mem_usage = stats["memory_stats"]["usage"]
                mem_mb = round(mem_usage / 1_000_000, 2)  # Convert to MB and round to two decimal places

                # GPU stats (if available)
                gpu_usage = 'N/A'  # Placeholder, modify this if you can fetch GPU stats

                # Log container metrics
                container_metrics.append({
                    "container": container_name,
                    "cpu": f"{cpu_percent}%",
                    "memory": f"{mem_mb}MB",
                    "gpu": gpu_usage
                })

        except Exception as e:
            print(f"Error fetching container stats: {e}")

        return container_metrics

    def get_system_info(self):
        gpu_usage, gpu_temp = self.get_host_gpu_stats()
        return {
            "host_cpu_usage": self.get_host_cpu_usage(),
            "host_gpu_usage": gpu_usage,
            "host_gpu_temp": gpu_temp,
            "host_cpu_temp": self.get_host_cpu_temp(),
            "host_memory_usage": self.get_host_memory_usage(),
            "container_info": self.get_container_stats()
        }
