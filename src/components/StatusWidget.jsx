import React, { useState, useEffect } from 'react';

function StatusWidget() {
  const [status, setStatus] = useState({
    gateway: true,
    assistants: 5,
    tasks: 8
  });

  useEffect(() => {
    // Simulate fetching status
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/system/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        // Keep default mock values on error
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="widget status-widget">
      <h3 className="widget-title">System Health</h3>
      <div className="status-list">
        <div className="status-item">
          <span className="status-icon success">✅</span>
          <span className="status-text">
            {status.gateway ? 'Gateway Online' : 'Gateway Offline'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-icon success">✅</span>
          <span className="status-text">
            {status.assistants} AI Assistants Active
          </span>
        </div>
        <div className="status-item">
          <span className="status-icon neutral">⏰</span>
          <span className="status-text">
            {status.tasks} Tasks Scheduled
          </span>
        </div>
      </div>
    </div>
  );
}

export default StatusWidget;