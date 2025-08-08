import sys
import os

print("--- Diagnostic Information ---")
print(f"Python Executable: {sys.executable}")
print(f"Current Directory: {os.getcwd()}")

print("\n--- Python Path (sys.path) ---")
for path_item in sys.path:
    print(path_item)

print("\n--- Import Test ---")
try:
    from app import db
    print("SUCCESS: The 'app' module was found and imported correctly.")
except ImportError as e:
    print(f"FAILURE: The 'app' module could not be imported.")
    print(f"Error Message: {e}")