from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON

db = SQLAlchemy()

class Bin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    fill_level = db.Column(db.Float)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    last_collected = db.Column(db.DateTime, nullable=True)

class Truck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    capacity = db.Column(db.Float)
    status = db.Column(db.String(50), default="idle")
    current_index = db.Column(db.Integer, default=0)

    route_locked = db.Column(db.Boolean, default=False)
    assigned_route = db.Column(JSON, nullable=True)