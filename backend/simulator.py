import requests
import random
import time

BASE_URL = "http://127.0.0.1:5000/sensor-data"

BASE_LAT = 18.5308
BASE_LON = 73.8478


def generate_virtual_bins():
    for i in range(2, 21):
        data = {
            "id": i,
            "name": f"Virtual Bin {i}",
            "latitude": BASE_LAT + random.uniform(-0.01, 0.01),
            "longitude": BASE_LON + random.uniform(-0.01, 0.01),
            "fill_level": random.randint(10, 100)
        }

        try:
            requests.post(BASE_URL, json=data)
            print(f"Updated Bin {i}: {data['fill_level']}%")
        except Exception as e:
            print("Simulator Error:", e)


def start_simulator():
    while True:
        generate_virtual_bins()
        time.sleep(5)