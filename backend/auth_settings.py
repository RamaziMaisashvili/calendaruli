import os
from pathlib import Path

# Private server file, outside the SFTP directory.


DB_HOST =  "127.0.0.1"
DB_PORT = int( "3306")
DB_NAME =  "api_site_calendar_api"
DB_USER = "api_site"
DB_PASSWORD = "Manchvi22!"
FRONTEND_ORIGIN = "https://calendar.learn.net.ge"
COOKIE_NAME = "calendar_session"
SESSION_HOURS = 12

TOKEN_ROTATE_SECONDS = 900
SESSION_IDLE_SECONDS = 900
