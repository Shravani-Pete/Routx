import networkx as nx
import math
from models import Bin, Truck, db
from datetime import datetime, timedelta


# -----------------------------
# Haversine Distance Formula
# -----------------------------
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# -----------------------------------------
# OPTIMIZE FLEET ROUTES (Capacity-Based)
# -----------------------------------------
def optimize_fleet_routes():
    FAIRNESS_HOURS = 6  # collect if not serviced in 6 hours

    now = datetime.utcnow()

    bins = []
    all_bins = Bin.query.all()

    for b in all_bins:

        high_fill = b.fill_level > 70

        not_serviced = (
            b.last_collected is None or
            (now - b.last_collected) > timedelta(hours=FAIRNESS_HOURS)
        )

        if high_fill or not_serviced:
            bins.append(b)
        trucks = Truck.query.all()

    if not bins or not trucks:
        return {}

    # Sort bins by highest fill first (priority)
    bins = sorted(bins, key=lambda b: b.fill_level, reverse=True)

    fleet_routes = {}
    remaining_bins = bins.copy()

    for truck in trucks:

        # 🔒 If route already locked → return same route
        if truck.route_locked and truck.assigned_route:
            fleet_routes[truck.name] = {
                "route": truck.assigned_route,
                "distance_km": calculate_total_distance(truck.assigned_route),
            }
            continue

        assigned_bins = []
        current_load = 0

        for bin_obj in remaining_bins[:]:
            bin_weight = bin_obj.fill_level  # assume 1% = 1kg

            if current_load + bin_weight <= truck.capacity:
                assigned_bins.append(bin_obj)
                current_load += bin_weight
                remaining_bins.remove(bin_obj)

        route = optimize_individual_route(assigned_bins)
        distance = calculate_total_distance(route)

        # 🔒 Lock route
        truck.assigned_route = route
        truck.route_locked = True
        truck.current_index = 0
        truck.status = "assigned"

        db.session.commit()

        fleet_routes[truck.name] = {
            "route": route,
            "distance_km": distance,
            "load_assigned": current_load,
        }

    return fleet_routes


# -----------------------------------------
# OPTIMIZE INDIVIDUAL ROUTE (Dijkstra)
# -----------------------------------------
def optimize_individual_route(bins):
    if not bins:
        return []

    G = nx.Graph()

    for b in bins:
        G.add_node(b.id, latitude=b.latitude, longitude=b.longitude)

    for i in range(len(bins)):
        for j in range(i + 1, len(bins)):
            dist = calculate_distance(
                bins[i].latitude,
                bins[i].longitude,
                bins[j].latitude,
                bins[j].longitude,
            )
            G.add_edge(bins[i].id, bins[j].id, weight=dist)

    start = bins[0].id
    ordered_route = [start]
    visited = {start}
    current = start

    while len(visited) < len(bins):
        shortest_next = None
        shortest_distance = float("inf")

        for b in bins:
            if b.id not in visited:
                dist = nx.dijkstra_path_length(G, current, b.id)
                if dist < shortest_distance:
                    shortest_distance = dist
                    shortest_next = b.id

        ordered_route.append(shortest_next)
        visited.add(shortest_next)
        current = shortest_next

    route_data = []
    for bin_id in ordered_route:
        bin_obj = Bin.query.get(bin_id)
        route_data.append(
            {
                "id": bin_obj.id,
                "latitude": bin_obj.latitude,
                "longitude": bin_obj.longitude,
                "fill_level": bin_obj.fill_level,
            }
        )

    return route_data


# -----------------------------------------
# TOTAL DISTANCE CALCULATION
# -----------------------------------------
def calculate_total_distance(route):
    if len(route) < 2:
        return 0

    total = 0
    for i in range(len(route) - 1):
        total += calculate_distance(
            route[i]["latitude"],
            route[i]["longitude"],
            route[i + 1]["latitude"],
            route[i + 1]["longitude"],
        )

    return round(total, 2)


# -----------------------------------------
# TRUCK MOVEMENT SIMULATION
# -----------------------------------------
def simulate_truck_movement(truck_id):
    truck = Truck.query.get(truck_id)

    if not truck:
        return None

    # If route not locked yet → generate
    if not truck.route_locked:
        optimize_fleet_routes()

    route = truck.assigned_route

    if not route:
        return None

    # If completed
    if truck.current_index >= len(route):
        truck.status = "completed"
        truck.route_locked = False
        truck.assigned_route = None
        truck.current_index = 0
        db.session.commit()

        return {
            "latitude": truck.latitude,
            "longitude": truck.longitude,
            "status": "completed",
        }

    # Move to next stop
    
    next_stop = route[truck.current_index]
    bin_obj = Bin.query.get(next_stop["id"])
    bin_obj.last_collected = datetime.utcnow()
    bin_obj.fill_level = 0  # assume emptied

    truck.latitude = next_stop["latitude"]
    truck.longitude = next_stop["longitude"]
    truck.status = "moving"
    truck.current_index += 1

    db.session.commit()

    return {
        "latitude": truck.latitude,
        "longitude": truck.longitude,
        "status": truck.status,
    }