import React, { useState, useEffect } from 'react';

const mockActivities = [
  { id: 1, icon: '🤖', text: 'Switched to Kimi K2.5', time: '2 minutes ago' },
  { id: 2, icon: '✅', text: 'Task completed: Daily backup', time: '15 minutes ago' },
  { id: 3, icon: '📧', text: 'Email check completed', time: '1 hour ago' },
  { id: 4, icon: '🔄', text: 'Gateway restarted', time: '3 hours ago' },
  { id: 5, icon: '📝', text: 'Memory updated', time: '5 hours ago' }
];

function ActivityWidget() {
  const [activities, setActivities] = useState(mockActivities);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activity/recent');
        if (response.ok) {
          const data = await response.json();
          if (data.activities && data.activities.length > 0) {
            setActivities(data.activities.slice(0, 5));
          }
        }
      } catch (error) {
        // Keep mock data on error
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="widget activity-widget">
      <h3 className="widget-title">Recent Activity</h3>
      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <span className="activity-icon">{activity.icon}</span>
            <div className="activity-content">
              <p className="activity-text">{activity.text}</p>
              <p className="activity-time">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityWidget;