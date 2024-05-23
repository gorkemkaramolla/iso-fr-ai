import logging
from logging.handlers import RotatingFileHandler
import json
import os
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
        return json.dumps(log_record)

def configure_logging(log_level=logging.INFO):
    aggressive_mode = os.getenv("AGGRESSIVE_LOGGING", "False").lower() in ['true', '1', 't']
    logger = logging.getLogger('audio_processing')
    logger.setLevel(log_level)

    f_handler = RotatingFileHandler('audio_processing.json', maxBytes=10000, backupCount=3)
    f_handler.setFormatter(JsonFormatter())

    logger.addHandler(f_handler)


    if aggressive_mode == True:
        logger.setLevel(logging.DEBUG)
    return logger
