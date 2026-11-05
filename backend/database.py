import os
import pymysql
import pymysql.cursors

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_NAME = os.getenv("DB_NAME", "api_site_calendar_api")
DB_USER = os.getenv("DB_USER", "api_site")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Manchvi22!")

def get_connection():
    """
    უერთდება MySQL მონაცემთა ბაზას PyMySQL-ის მეშვეობით
    """
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=5,
        read_timeout=10,
        write_timeout=10
    )
