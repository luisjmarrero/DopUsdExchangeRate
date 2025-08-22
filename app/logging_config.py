import logging
import logging.config
from datetime import datetime, timezone, timedelta

# Define Santo Domingo timezone (AST, UTC-4)
AST = timezone(timedelta(hours=-4))

class ASTFormatter(logging.Formatter):
    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, tz=timezone.utc).astimezone(AST)
        if datefmt:
            return dt.strftime(datefmt)
        return dt.isoformat()

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'detailed': {
            'class': 'app.logging_config.ASTFormatter',
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S %Z',
        },
        'access': {
            'class': 'app.logging_config.ASTFormatter',
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S %Z',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'detailed',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/app.log',
            'level': 'INFO',
            'formatter': 'detailed',
        },
        'access': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'access',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'uvicorn.access': {
            'handlers': ['access'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

def setup_logging():
    logging.config.dictConfig(LOGGING_CONFIG)