from flask import Flask
from config import Config
from models import db
from routes import api
from models import Truck
import threading
from simulator import start_simulator

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

app.register_blueprint(api)

with app.app_context():
    db.create_all()

    if not Truck.query.first():
        t1 = Truck(name="Truck 1", latitude=18.5308, longitude=73.8478, capacity=500)
        t2 = Truck(name="Truck 2", latitude=18.5350, longitude=73.8500, capacity=500)
        db.session.add_all([t1, t2])
        db.session.commit()

if __name__ == "__main__":

    # Start simulator in background thread
    simulator_thread = threading.Thread(target=start_simulator)
    simulator_thread.daemon = True
    simulator_thread.start()

    app.run(debug=True, use_reloader=False)