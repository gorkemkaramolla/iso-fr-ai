from socketio_instance import socketio
import subprocess
import re
import platform
import psutil
import xmltodict
import time
from threading import Thread
from logger import configure_logging
import docker
from docker.errors import DockerException
import logging
import shutil


class SystemMonitoring:
    def __init__(self):
        self.logger = configure_logging()
        self.socketio = socketio
        self.client = self.initialize_docker_client()
        if self.client:
            thread = Thread(target=self.send_system_info)
            thread.start()
        else:
            self.logger.error(
                "Failed to initialize Docker client. Monitoring not started."
            )

    def initialize_docker_client(self):
        try:
            client = docker.from_env()
            client.ping()
            self.logger.info("Successfully connected to Docker daemon.")
            return client
        except DockerException as e:
            self.logger.error(f"Failed to connect to Docker daemon: {e}")
            return None

    def get_cpu_temp_linux(self):
        sensors_path = shutil.which("sensors")
        if not sensors_path:
            self.logger.error("sensors command not found in PATH")
            return "N/A"

        try:
            result = subprocess.run([sensors_path], stdout=subprocess.PIPE, text=True)
            if result.returncode != 0:
                self.logger.error("sensors command failed")
                return "N/A"

            output = result.stdout
            core_temps = {}
            matches = re.findall(r"Core\s+\d+:\s+\+([\d.]+)°C", output)
            if matches:
                core_temps = {
                    f"Core {i}": float(temp) for i, temp in enumerate(matches)
                }
                avg_temp = sum(core_temps.values()) / len(core_temps)
                return f"{avg_temp:.2f}"  # Return as a string for consistency
            else:
                self.logger.warning("No temperature data found in sensors output")
                return "N/A"
        except Exception as e:
            self.logger.error(f"Failed to retrieve CPU temperature: {e}")
            return "N/A"

    def get_cpu_temp(self):
        if platform.system() == "Linux":
            return self.get_cpu_temp_linux()
        elif platform.system() == "Windows":
            return self.get_cpu_temp_windows()
        else:
            return "N/A"

    def get_gpu_stats(self):
        nvidia_smi_path = shutil.which("nvidia-smi")
        if not nvidia_smi_path:
            self.logger.error("nvidia-smi command not found in PATH")
            return "N/A", "N/A", "N/A"

        try:
            result = subprocess.run(
                [nvidia_smi_path, "-q", "-x"], capture_output=True, text=True
            )
            if result.returncode != 0:
                self.logger.error("nvidia-smi command failed")
                return "N/A", "N/A", "N/A"

            gpu_info = result.stdout
            gpu_data = xmltodict.parse(gpu_info)
            gpu_temp = gpu_data["nvidia_smi_log"]["gpu"]["temperature"]["gpu_temp"]
            gpu_usage = gpu_data["nvidia_smi_log"]["gpu"]["utilization"]["gpu_util"]
            gpu_memory_total = gpu_data["nvidia_smi_log"]["gpu"]["fb_memory_usage"][
                "total"
            ]
            gpu_memory_used = gpu_data["nvidia_smi_log"]["gpu"]["fb_memory_usage"][
                "used"
            ]
            gpu_memory_usage = f"{gpu_memory_used} MiB / {gpu_memory_total} MiB"
            return gpu_temp, gpu_usage, gpu_memory_usage
        except Exception as e:
            self.logger.error(f"Failed to retrieve GPU stats: {e}")
            return "N/A", "N/A", "N/A"

    def calculate_cpu_percent(self, cpu_stats, precpu_stats):
        cpu_delta = (
            cpu_stats["cpu_usage"]["total_usage"]
            - precpu_stats["cpu_usage"]["total_usage"]
        )
        system_delta = cpu_stats["system_cpu_usage"] - precpu_stats["system_cpu_usage"]
        number_cpus = cpu_stats["online_cpus"]

        if system_delta > 0 and cpu_delta > 0:
            cpu_percent = (cpu_delta / system_delta) * number_cpus * 100.0
        else:
            cpu_percent = 0.0
        return cpu_percent

    def get_container_stats(self):
        container_stats = {}
        total_cpu_percent = 0.0
        if not self.client:
            return container_stats, total_cpu_percent

        try:
            containers = self.client.containers.list()
            for container in containers:
                try:
                    stats = container.stats(stream=False)
                    cpu_stats = stats["cpu_stats"]
                    precpu_stats = stats["precpu_stats"]
                    cpu_percent = self.calculate_cpu_percent(cpu_stats, precpu_stats)
                    total_cpu_percent += cpu_percent
                    container_stats[container.name] = {
                        "cpu_usage": f"{cpu_percent:.2f}%",
                        "memory_usage": stats["memory_stats"]["usage"]
                        / (1024**2),  # Convert bytes to MB
                        "memory_limit": stats["memory_stats"]["limit"]
                        / (1024**2),  # Convert bytes to MB
                        "network_io": stats["networks"],
                        "block_io": stats["blkio_stats"]["io_service_bytes_recursive"],
                    }
                except KeyError as ke:
                    self.logger.error(f"KeyError for container {container.name}: {ke}")
                except Exception as e:
                    self.logger.error(
                        f"Error retrieving stats for container {container.name}: {e}"
                    )
        except Exception as e:
            self.logger.error(f"Failed to get container stats: {e}")
        return container_stats, total_cpu_percent

    def get_system_info(self):
        cpu_temp = self.get_cpu_temp()
        cpu_usage = psutil.cpu_percent(interval=1)
        gpu_temp, gpu_usage, gpu_memory_usage = self.get_gpu_stats()
        memory = psutil.virtual_memory()
        memory_usage = (
            f"{memory.used // (1024 ** 3)}GB / {memory.total // (1024 ** 3)}GB"
        )
        container_stats, total_cpu_percent = self.get_container_stats()

        system_info = {
            "host_cpu_usage": f"{cpu_usage}%",
            "host_gpu_usage": gpu_usage,
            "host_gpu_temp": gpu_temp,
            "host_cpu_temp": cpu_temp,
            "host_memory_usage": memory_usage,
            "total_container_cpu_usage": f"{total_cpu_percent:.2f}%",
            "total_container_cpus": psutil.cpu_count(logical=True),
            "container_info": [
                {
                    "container": name,
                    "cpu": stats["cpu_usage"],
                    "memory": f"{stats['memory_usage']:.2f}MB",
                    "gpu": "N/A",
                }
                for name, stats in container_stats.items()
            ],
        }
        return system_info

    def send_system_info(self):
        while True:
            try:
                system_info = self.get_system_info()
                self.socketio.emit("system_info", system_info)
                time.sleep(2)
            except Exception as e:
                self.logger.error(f"Error during system monitoring: {e}")
                time.sleep(10)
