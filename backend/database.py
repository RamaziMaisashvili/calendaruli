import pymysql
import auth_settings as settings

def connect():
    return pymysql.connect(
        host=settings.DB_HOST, port=settings.DB_PORT,
        user=settings.DB_USER, password=settings.DB_PASSWORD,
        database=settings.DB_NAME, charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor, autocommit=False,
        connect_timeout=5, read_timeout=10, write_timeout=10,
    )
