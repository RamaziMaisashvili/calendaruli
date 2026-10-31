import getpass
from database import connect
from auth import hash_password

if __name__ == "__main__":
    username = input("Username: ").strip()
    name = input("Display name: ").strip()
    password = getpass.getpass("Password (at least 12 characters): ")
    repeated = getpass.getpass("Repeat password: ")
    if not username or len(username)>190 or not name or len(name)>190:
        raise SystemExit("Invalid username or display name")
    if password != repeated or len(password)<12 or len(password)>1024:
        raise SystemExit("Passwords must match and contain 12 to 1024 characters")
    db = connect()
    try:
        with db.cursor() as cur:
            cur.execute("INSERT INTO api_users(username,name,password_hash) VALUES (%s,%s,%s)",
                        (username,name,hash_password(password)))
        db.commit()
        print("User created")
    finally:
        db.close()
