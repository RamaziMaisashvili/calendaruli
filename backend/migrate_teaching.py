"""Additive, repeatable schema install using existing database.py settings."""
from pathlib import Path
from database import connect

def main():
    db=connect()
    try:
        with db.cursor() as cursor:
            cursor.execute('SELECT id FROM ci_plans LIMIT 1')
            cursor.fetchone()
            for statement in Path(__file__).with_name('teaching.sql').read_text(encoding='utf-8').split(';'):
                if statement.strip():cursor.execute(statement)
        db.commit()
        print('Teaching tables installed. Existing programs, users and sessions were not changed.')
    except Exception:
        db.rollback()
        raise
    finally:db.close()

if __name__=='__main__':main()
