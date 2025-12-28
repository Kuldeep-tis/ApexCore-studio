import sys, os

# Point to your application directory
INTERP = sys.executable
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.append(os.getcwd())

# Import the 'app' object from main.py and rename it to 'application'
# Hostinger looks for 'application', not 'app'
from main import app as application
