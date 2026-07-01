import sqlite3

def run_migration():
    conn = sqlite3.connect('paddy_monitoring.db')
    cursor = conn.cursor()
    
    columns = [
        ("aadhaar", "VARCHAR"),
        ("address", "VARCHAR"),
        ("district", "VARCHAR"),
        ("gender", "VARCHAR")
    ]
    
    for col_name, col_type in columns:
        try:
            cursor.execute(f"ALTER TABLE farmers ADD COLUMN {col_name} {col_type};")
            print(f"Added column {col_name} successfully.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Database migration complete.")

if __name__ == "__main__":
    run_migration()
