import logging
from logging.handlers import RotatingFileHandler
import json
import os
import atexit

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "time": self.formatTime(record, self.datefmt),
            "name": record.name,
            "level": record.levelname,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)
        return log_record  # Return dictionary formatted log record.

class JsonArrayRotatingFileHandler(RotatingFileHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.log_records = []

    def emit(self, record):
        log_entry = self.format(record)  # This returns a dictionary.
        self.log_records.append(log_entry)  # Directly append the dictionary.

    def close(self):
        if self.log_records:  # Only write if there are records to write.
            with open(self.baseFilename, 'w') as f:
                json.dump(self.log_records, f, indent=4)  # Write JSON data formatted for readability.
        super().close()

def configure_logging(log_level=logging.INFO):
    aggressive_mode = os.getenv("AGGRESSIVE_LOGGING", "False").lower() in ['true', '1', 't']
    logger = logging.getLogger('audio_processing')
    logger.setLevel(log_level)

    if not os.path.exists('logs'):
        os.makedirs('logs')
        
    f_handler = JsonArrayRotatingFileHandler('./logs/audio_processing.json', maxBytes=10000, backupCount=3)
    f_handler.setFormatter(JsonFormatter())

    logger.addHandler(f_handler)

    if aggressive_mode:
        logger.setLevel(logging.DEBUG)

    atexit.register(f_handler.close)

    return logger
