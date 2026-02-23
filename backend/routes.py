from flask import Blueprint, request, jsonify
from models import db, Bin
from datetime import datetime
from route_engine import simulate_truck_movement

from route_engine import optimize_fleet_routes

api = Blueprint("api", __name__)

# ---------------------------
# POST /sensor-data
# ---------------------------
@api.route("/sensor-data", methods=["POST"])
def sensor_data():
    data = request.json

    bin_obj = Bin.query.get(data["id"])

    if bin_obj:
        bin_obj.fill_level = data["fill_level"]
        bin_obj.last_updated = datetime.utcnow()
    else:
        bin_obj = Bin(
            id=data["id"],
            name=data["name"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            fill_level=data["fill_level"]
        )
        db.session.add(bin_obj)

    db.session.commit()

    return jsonify({"message": "Data saved successfully"})


# ---------------------------
# GET /bins
# ---------------------------
@api.route("/bins", methods=["GET"])
def get_bins():
    bins = Bin.query.all()

    result = []
    for b in bins:
        result.append({
            "id": b.id,
            "name": b.name,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "fill_level": b.fill_level
        })

    return jsonify(result)

@api.route("/optimize-route", methods=["GET"])
def get_optimized_route():
    routes = optimize_fleet_routes()
    return jsonify(routes)

@api.route("/impact", methods=["GET"])
def calculate_impact():
    routes = optimize_fleet_routes()

    FIXED_DISTANCE = 20   # assume fixed route 20km
    MILEAGE = 5           # km per liter
    CO2_PER_LITER = 2.3   # kg

    total_optimized_distance = 0

    for truck in routes.values():
        total_optimized_distance += truck["distance_km"]

    fixed_fuel = FIXED_DISTANCE / MILEAGE
    optimized_fuel = total_optimized_distance / MILEAGE

    fuel_saved = round(fixed_fuel - optimized_fuel, 2)
    co2_saved = round(fuel_saved * CO2_PER_LITER, 2)

    return jsonify({
        "fixed_distance_km": FIXED_DISTANCE,
        "optimized_distance_km": round(total_optimized_distance, 2),
        "fuel_saved_liters": fuel_saved,
        "co2_saved_kg": co2_saved
    })

@api.route("/truck-location/<int:truck_id>", methods=["GET"])
def get_truck_location(truck_id):
    location = simulate_truck_movement(truck_id)
    return jsonify(location)