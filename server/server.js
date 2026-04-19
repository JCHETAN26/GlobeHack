const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Mock Fleet State
let fleetState = {
  dispatchers: [
    { id: 'disp1', name: 'Maria' }
  ],
  drivers: [
    { 
      id: 'driver1', 
      name: 'John Doe (The Perfect Match)', 
      location: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles' },
      hosRemaining: 10.5, 
      lastLoad: 'Electronics',
      status: 'available',
      fatigueFlag: false
    },
    { 
      id: 'driver2', 
      name: 'Alex Martinez (The Fatigue Risk)', 
      location: { lat: 33.7490, lng: -84.3880, city: 'Atlanta' },
      hosRemaining: 1.5, 
      lastLoad: 'Produce',
      status: 'available',
      fatigueFlag: true
    },
    { 
      id: 'driver3', 
      name: 'Sam Smith (The Deadhead Risk)', 
      location: { lat: 41.8781, lng: -87.6298, city: 'Chicago' },
      hosRemaining: 9.0, 
      lastLoad: 'Furniture',
      status: 'available',
      fatigueFlag: false
    }
  ],
  loads: [
    { id: 'load1', origin: 'Los Angeles', destination: 'Las Vegas', mileage: 270, status: 'unassigned', priority: 'high' },
    { id: 'load2', origin: 'Dallas', destination: 'Chicago', mileage: 920, status: 'unassigned', priority: 'medium' },
    { id: 'load3', origin: 'Seattle', destination: 'Portland', mileage: 170, status: 'unassigned', priority: 'low' }
  ],
  alerts: []
};

// WebSocket logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send initial state
  socket.emit('state_update', fleetState);

  socket.on('assign_load', ({ loadId, driverId }) => {
    const load = fleetState.loads.find(l => l.id === loadId);
    const driver = fleetState.drivers.find(d => d.id === driverId);

    if (load && driver) {
      load.status = 'assigned';
      load.assignedDriver = driver.name;
      driver.status = 'on-duty';
      
      // Update fleet state
      const alert = {
        id: Date.now(),
        type: 'assignment',
        message: `Load ${load.id} assigned to ${driver.name}`,
        timestamp: new Date().toISOString()
      };
      fleetState.alerts.push(alert);

      io.emit('state_update', fleetState);
      io.emit('load_assigned', { load, driverId });
      console.log(`Load ${loadId} assigned to ${driverId}`);
    }
  });

  socket.on('bol_uploaded', ({ driverId, loadId }) => {
    const alert = {
      id: Date.now(),
      type: 'document',
      message: `BOL uploaded by driver ${driverId} for load ${loadId}`,
      timestamp: new Date().toISOString()
    };
    fleetState.alerts.push(alert);
    io.emit('state_update', fleetState);
    io.emit('new_alert', alert);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// AI Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  const aiService = require('./ai-service');
  
  try {
    const response = await aiService.getRecommendation(message, fleetState);
    res.json({ response });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to get AI recommendation' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
