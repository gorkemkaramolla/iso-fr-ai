import logging
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
        return log_record  # Return dictionary formatted log record.

class JsonConsoleHandler(logging.StreamHandler):
    def emit(self, record):
        try:
            log_entry = self.format(record)  # This returns a dictionary.
            print(json.dumps(log_entry))  # Print the JSON string.
        except Exception as e:
            self.handleError(record)

def configure_logging(log_level=logging.INFO):
    aggressive_mode = os.getenv("AGGRESSIVE_LOGGING", "False").lower() in ['true', '1', 't']
    logger = logging.getLogger('audio_processing')
    logger.setLevel(log_level)

    f_handler = JsonConsoleHandler()
    f_handler.setFormatter(JsonFormatter())

    logger.addHandler(f_handler)

    if aggressive_mode:
        logger.setLevel(logging.DEBUG)

    return logger

if __name__ == "__main__":
    logger = configure_logging()
    logger.info("This is an info log message.")
    logger.error("This is an error log message.")
  
