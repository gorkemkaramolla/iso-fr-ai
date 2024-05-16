import logging
from logging.handlers import RotatingFileHandler
import json

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "name": record.name,
            "level": record.levelname,
            "message": record.getMessage(),
            "time": self.formatTime(record, self.datefmt),
        }
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def configure_logging(log_level=logging.INFO, aggressive=False):
    logger = logging.getLogger('audio_processing')
    logger.setLevel(log_level)

    # Handler for rotating file
    f_handler = RotatingFileHandler('audio_processing.json', maxBytes=10000, backupCount=3)
    f_handler.setFormatter(JsonFormatter())

    logger.addHandler(f_handler)

    # If aggressive logging is enabled, change the log level to DEBUG and potentially add more log details
    if aggressive:
        logger.setLevel(logging.DEBUG)
        # You could add additional handlers or formatters here if needed

    return logger
