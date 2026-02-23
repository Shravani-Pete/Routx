# Routx Backend

This is the backend for the Routx project, a smart waste management and route optimization system.

## APIs and Functionality

### 1. `POST /sensor-data`
- **Purpose**: Receives and stores waste bin sensor data.
- **Payload**:
  ```json
  {
      "id": 1,
      "name": "Bin Name",
      "latitude": 18.5308,
      "longitude": 73.8478,
      "fill_level": 80
  }
  ```
- **Description**: Updates an existing bin's fill level or creates a new bin if the ID doesn't exist.

### 2. `GET /bins`
- **Purpose**: Retrieves a list of all monitored bins.
- **Response**: A list of bin objects containing ID, name, location, and fill level.

### 3. `GET /optimize-route`
- **Purpose**: Generates optimized collection routes for the truck fleet.
- **Description**: Uses a routing engine to calculate the most efficient path based on bin fill levels.

### 4. `GET /impact`
- **Purpose**: Calculates the environmental and fuel savings.
- **Response**:
  - `fixed_distance_km`: Conventional route distance.
  - `optimized_distance_km`: Distance with optimization.
  - `fuel_saved_liters`: Estimated fuel saved.
  - `co2_saved_kg`: Estimated CO2 emissions reduction.

### 5. `GET /truck-location/<truck_id>`
- **Purpose**: Tracks the real-time (simulated) location of a specific truck.

## Requirements and Setup

To pull and run this project:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shravani-Pete/Routx.git
   ```
2. **Setup Virtual Environment**:
   ```bash
   python -m venv virtualEnv
   source virtualEnv/bin/activate  # On Windows: virtualEnv\Scripts\activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. **Run the Application**:
   ```bash
   python backend/app.py
   ```

Maintained by **Aayush Sirsat (aayushsirsat02)**.
