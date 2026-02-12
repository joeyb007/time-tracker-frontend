import { useState } from 'react'
import weekData from './week_data_classified.json'


const dates = Object.keys(weekData).sort()
const days = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"]

const categoryColors = {
  "Miscellaneous": "#6366f1",      
  "Personal Development": "#8b5cf6", 
  "Hobbies/Leisure": "#3b82f6",     
  "Food Preparation": "#f59e0b",   
  "Work/Internship": "#10b981",  
  "Education/Lecture": "#ef4444",
  "Travel": "#6b7280",
  "Socializing": "#ec4899",
  "Other": "#94a3b8"
}

const screenTimeData = [
  { day: "T", total: 2.5, unproductive: 0.4 },
  { day: "W", total: 3.3, unproductive: 1.8 },
  { day: "T", total: 1.8, unproductive: 0.1 },
  { day: "F", total: 2.4, unproductive: 0.6 },
  { day: "S", total: 2.5, unproductive: 0.9 },
  { day: "S", total: 2.5, unproductive: 1.0 },
  { day: "M", total: 4.1, unproductive: 1.9 },
]

const timeLabels = ["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"]

function getTimeFromIndex(index) {
  const hours = Math.floor(index / 2)
  const minutes = (index % 2) * 30
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function App() {
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null })
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const allMoods = Object.values(weekData).flat().map(slot => slot?.mood).filter(Boolean)
  const averageMood = (allMoods.reduce((a, b) => a + b, 0) / allMoods.length).toFixed(1)

  const handleCellHover = (e, slot, dayIndex, timeIndex) => {
    if (!slot) return
    const rect = e.target.getBoundingClientRect()
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: {
        activity: slot.activity,
        mood: slot.mood,
        time: getTimeFromIndex(timeIndex),
        day: days[dayIndex]
      }
    })
  }

  const handleCellLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: null })
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoading) return

    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput("")
    setIsLoading(true)

   try {
      const response = await fetch('https://time-tracker-backend-production-40ca.up.railway.app/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })
      const data = await response.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setIsLoading(false)
}
  }


  const maxScreenTime = Math.max(...screenTimeData.map(d => d.total))

  return (
    <div className="app">
      {/* Tooltip */}
      {tooltip.show && tooltip.content && (
        <div 
          className="tooltip"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="tooltip-activity">{tooltip.content.activity}</div>
          <div className="tooltip-details">
            <span>{tooltip.content.day} {tooltip.content.time}</span>
            <span className="tooltip-mood">Mood: {tooltip.content.mood}/10</span>
          </div>
        </div>
      )}

      <h1 className="title">Joseph's Week in Review.</h1>

      <div className="dashboard">
        {/* Time Grid */}
        <div className="grid-container">
          {/* Time labels */}
          <div className="time-labels">
            {timeLabels.map((label, i) => (
              <div key={i} className="time-label">{label}</div>
            ))}
          </div>

          {/* Days */}
          <div className="days-grid">
            {days.map((day, dayIndex) => (
              <div key={day} className="day-column">
                <div className="day-header">{day}</div>
                <div className="slots">
                  {weekData[dates[dayIndex]]?.map((slot, timeIndex) => (
                    <div
                      key={timeIndex}
                      className="slot"
                      style={{ 
                        backgroundColor: slot ? categoryColors[slot.category] || categoryColors.Other : '#2a2a3e'
                      }}
                      onMouseEnter={(e) => handleCellHover(e, slot, dayIndex, timeIndex)}
                      onMouseLeave={handleCellLeave}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {/* Screen Time Chart */}
          <div className="widget screen-time-widget">
            <h2>Screen Time</h2>
            <div className="chart">
              <div className="chart-y-axis">
                <span>4h</span>
                <span>3h</span>
                <span>2h</span>
                <span>1h</span>
              </div>
              <div className="bars">
                {screenTimeData.map((data, i) => (
                  <div key={i} className="bar-container">
                    <div className="bar-stack">
                      <div 
                        className="bar bar-total"
                        style={{ height: `${(data.total / maxScreenTime) * 100}%` }}
                      />
                      <div 
                        className="bar bar-unproductive"
                        style={{ height: `${(data.unproductive / maxScreenTime) * 100}%` }}
                      />
                    </div>
                    <span className="bar-label">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color unproductive"></span>
                <span>Unproductive</span>
              </div>
              <div className="legend-item">
                <span className="legend-color total"></span>
                <span>Total</span>
              </div>
            </div>
          </div>

          {/* Average Mood */}
          <div className="widget mood-widget">
            <h2>Average Mood</h2>
            <div className="mood-score">{averageMood} / 10</div>
          </div>

          {/* Chatbot */}
          <div className="widget chat-widget">
            <h2>Ask (me) about my week!</h2>
            <div className="chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="chat-message assistant loading">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
            </div>
            <form onSubmit={handleChatSubmit} className="chat-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading}>→</button>
            </form>
          </div>
        </div>
      </div>

      {/* Category Legend */}
      <div className="category-legend">
        {Object.entries(categoryColors).map(([category, color]) => (
          <div key={category} className="category-item">
            <span className="category-color" style={{ backgroundColor: color }}></span>
            <span>{category}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
