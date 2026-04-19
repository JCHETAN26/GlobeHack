import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Truck, MapPin, AlertTriangle, Send, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io('http://localhost:3001');

function App() {
  const [state, setState] = useState({ drivers: [], loads: [], alerts: [] });
  const [chat, setChat] = useState([{ role: 'ai', content: "Hello Maria! I'm your FleetMind co-pilot. How can I help you optimize dispatch today?" }]);
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.on('state_update', (newState) => {
      setState(newState);
    });

    socket.on('new_alert', (alert) => {
      // Simple notification handling if needed
    });

    return () => {
      socket.off('state_update');
      socket.off('new_alert');
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setChat(prev => [...prev, userMsg]);
    setInput('');
    setIsAiLoading(true);

    try {
      const { data } = await axios.post('http://localhost:3001/api/ai/chat', { message: input });
      setChat(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (error) {
      setChat(prev => [...prev, { role: 'ai', content: "Error: Could not reach the AI service." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const assignLoad = (loadId, driverId) => {
    socket.emit('assign_load', { loadId, driverId });
  };

  const getHosColor = (hos) => {
    if (hos < 3) return '#ef4444';
    if (hos < 5) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div className="dashboard">
      <header>
        <div className="logo">FLEETMIND AI</div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <span>Active Drivers: {state.drivers.filter(d => d.status === 'on-duty').length}</span>
          <span>Unassigned Loads: {state.loads.filter(l => l.status === 'unassigned').length}</span>
          <span style={{ color: '#22c55e' }}>● System Live</span>
        </div>
      </header>

      {/* Driver List Panel */}
      <aside className="panel">
        <div className="panel-header">
          <span>DRIVERS</span>
          <Truck size={20} />
        </div>
        <div className="scroll-area">
          {state.drivers.map(driver => (
            <div key={driver.id} className="driver-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{driver.name}</span>
                {driver.fatigueFlag && <AlertTriangle size={16} color="#ef4444" />}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {driver.location.city}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>HOS Remaining: {driver.hosRemaining}h</span>
                <span style={{ 
                  color: driver.status === 'available' ? '#22c55e' : '#6366f1',
                  fontWeight: 'bold'
                }}>{driver.status.toUpperCase()}</span>
              </div>
              <div className="hos-bar">
                <div 
                  className="hos-progress" 
                  style={{ 
                    width: `${(driver.hosRemaining / 11) * 100}%`,
                    backgroundColor: getHosColor(driver.hosRemaining)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* AI Chat Panel */}
      <main className="panel">
        <div className="panel-header" style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}>
          <span>AI DISPATCH CO-PILOT</span>
        </div>
        <div className="chat-messages">
          {chat.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.content}
              {msg.role === 'ai' && msg.content.includes('Driver 1') && state.loads.length > 0 && (
                <div>
                  <button 
                    className="ai-action-btn"
                    onClick={() => assignLoad(state.loads[0].id, 'driver1')}
                  >
                    Assign LA Load to Driver 1
                  </button>
                </div>
              )}
            </div>
          ))}
          {isAiLoading && <div className="message ai">Thinking...</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input">
          <input 
            type="text" 
            placeholder="Ask AI dispatch recommendations..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage}>
            <Send size={20} />
          </button>
        </div>
      </main>

      {/* Loads & Alerts Panel */}
      <aside className="panel">
        <div className="panel-header">
          <span>LOAD BOARD</span>
        </div>
        <div className="scroll-area">
          <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>UNASSIGNED LOADS</h4>
          {state.loads.filter(l => l.status === 'unassigned').map(load => (
            <div key={load.id} className={`load-card priority-${load.priority}`}>
              <div style={{ fontWeight: 600 }}>{load.origin} → {load.destination}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                {load.mileage} miles • <span className={`badge badge-${load.priority === 'high' ? 'danger' : 'warning'}`}>{load.priority}</span>
              </div>
            </div>
          ))}
          
          <h4 style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2rem', marginBottom: '1rem' }}>SYSTEM ALERTS</h4>
          <AnimatePresence>
            {[...state.alerts].reverse().map(alert => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={alert.id}
                style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '0.5rem', 
                  marginBottom: '0.5rem',
                  borderLeft: `3px solid ${alert.type === 'document' ? '#22c55e' : '#6366f1'}`
                }}
              >
                <div style={{ fontSize: '0.85rem' }}>{alert.message}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </aside>
    </div>
  );
}

export default App;
