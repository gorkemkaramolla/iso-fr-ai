import subprocess
import re
import platform
import psutil
import xmltodict
import time
from threading import Thread
# import wmi
from logger import configure_logging
# Configure logging
from socketio_instance import socketio
logger = configure_logging()
import  json
class SystemMonitoring:
    def __init__(self):
        self.socketio = socketio
        thread = Thread(target=self.send_system_info)
        
        thread.start()


    def get_cpu_temp_linux(self):
        try:
            result = subprocess.run(['sensors'], stdout=subprocess.PIPE, text=True)
            output = result.stdout
            core_temps = {}
            matches = re.findall(r'Core\s+\d+:\s+\+([\d.]+)°C', output)
            if matches:
                core_temps = {f"Core {i}": float(temp) for i, temp in enumerate(matches)}
                avg_temp = sum(core_temps.values()) / len(core_temps)
                logger.info(f"Average CPU temperature: {avg_temp}°C")
                return avg_temp
            else:
                logger.error("No CPU core temperatures found.")
                return 'N/A'
        except Exception as e:
            logger.error(f"Failed to get CPU temperatures: {e}")
            return 'N/A'

    
    # def get_cpu_temp_windows(self):
    #     try:
    #         w = wmi.WMI(namespace="root\\OpenHardwareMonitor")
    #         temperature_infos = w.Sensor()
    #         for sensor in temperature_infos:
    #             if sensor.SensorType == 'Temperature' and 'CPU' in sensor.Name:
    #                 logger.info(f"Windows CPU temperature: {sensor.Value}°C")
    #                 return sensor.Value
    #     except Exception as e:
    #         logger.error(f"Failed to get Windows CPU temperature: {e}")
    #     return 'N/A'

    def get_cpu_temp(self):
        if platform.system() == 'Linux':
            return self.get_cpu_temp_linux()
        elif platform.system() == 'Windows':
            return self.get_cpu_temp_windows()
        else:
            logger.info(f"Unsupported platform: {platform.system()}")
            return 'N/A'

    def get_gpu_stats(self):
        try:
            result = subprocess.run(['nvidia-smi', '-q', '-x'], capture_output=True, text=True)
            gpu_info = result.stdout
            gpu_data = xmltodict.parse(gpu_info)
            gpu_temp = gpu_data['nvidia_smi_log']['gpu']['temperature']['gpu_temp']
            gpu_usage = gpu_data['nvidia_smi_log']['gpu']['utilization']['gpu_util']
            gpu_memory_total = gpu_data['nvidia_smi_log']['gpu']['fb_memory_usage']['total']
            gpu_memory_used = gpu_data['nvidia_smi_log']['gpu']['fb_memory_usage']['used']
            gpu_memory_usage = f"{gpu_memory_used} MiB / {gpu_memory_total} MiB"
            logger.info(f"GPU Temperature: {gpu_temp}°C")
            logger.info(f"GPU Usage: {gpu_usage}%")
            logger.info(f"GPU Memory Usage: {gpu_memory_usage}")
            return gpu_temp, gpu_usage, gpu_memory_usage
        except Exception as e:
            logger.error(f"Failed to get GPU stats: {e}")
            return 'N/A', 'N/A', 'N/A'

    def send_system_info(self):
        logs_file_path = './logs/audio_processing.json'  # Adjust this to your logs.json file path

        while True:
            try:
                with open(logs_file_path, 'r') as file:
                    logs_data = json.load(file)

                # Gather system stats
                cpu_temp = self.get_cpu_temp()
                cpu_usage = psutil.cpu_percent(interval=1)
                gpu_temp, gpu_usage, gpu_memory_usage = self.get_gpu_stats()
                memory = psutil.virtual_memory()
                memory_usage = f"{memory.used // (1024 ** 3)}GB / {memory.total // (1024 ** 3)}GB"
                
                # Compile the data to be sent
                system_info = {
                    'cpu_temperature': cpu_temp,
                    'cpu_usage': cpu_usage,
                    'gpu_temperature': gpu_temp,
                    'gpu_usage': gpu_usage,
                    'gpu_memory_usage': gpu_memory_usage,
                    'memory_usage': memory_usage,
                    'logs_data': logs_data  # Add logs data
                }

                # Emit system info and logs data
                self.socketio.emit('system_info', system_info)
                time.sleep(2)  # Adjustable interval for updates
            except Exception as e:
                print(f"Error during system monitoring or reading logs: {e}")
                # Handle exceptions, perhaps wait a bit longer if there's an error
                time.sleep(10)