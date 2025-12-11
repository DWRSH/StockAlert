import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

# 👇 Purana Model
from app.models.alert import Alert
# 👇 Naya User Model Import kiya
from app.models.user import User

load_dotenv()

async def init_db():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME")
    
    client = AsyncIOMotorClient(uri)
    database = client[db_name]
    
    # 👇 Database initialize karte waqt dono models list me daalein
    await init_beanie(database=database, document_models=[Alert, User])
    
    print("✅ MongoDB Connected & Models Loaded (Alerts + Users)!")