import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

# Models
from app.models.alert import Alert
from app.models.user import User

load_dotenv()

# ✅ 1. GLOBAL VARIABLES define karein (Zaroori hai taaki portfolio.py isse import kar sake)
client = None
db = None 

async def init_db():
    global client, db
    
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME")
    
    # 2. Connection banayein
    client = AsyncIOMotorClient(uri)
    
    # 3. Global 'db' variable set karein (Ye line missing thi pehle)
    db = client[db_name]
    
    # 4. Beanie Initialize karein (User/Alert models ke liye)
    await init_beanie(database=db, document_models=[Alert, User])
    
    print("✅ MongoDB Connected & Models Loaded (Alerts + Users)!")
