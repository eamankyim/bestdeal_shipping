import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * Reusable Stats Card Component
 * Used across all dashboard pages for consistent UI
 */
const StatsCard = ({ 
  title, 
  value, 
  prefix, 
  suffix,
  icon,
  trend, // { value: 10, direction: 'up' }
  loading = false,
  precision = 0,
  valueStyle = {}
}) => {
  const getTrendColor = (direction) => {
    if (direction === 'up') return '#3f8600';
    if (direction === 'down') return '#cf1322';
    return '#666';
  };

  return (
    <Card loading={loading} bordered={false} className="stats-card">
      <Statistic
        title={title}
        value={value}
        precision={precision}
        valueStyle={{ 
          color: trend ? getTrendColor(trend.direction) : '#000',
          ...valueStyle 
        }}
        prefix={icon || prefix}
        suffix={suffix}
      />
      {trend && (
        <div style={{ marginTop: 8, fontSize: 14 }}>
          {trend.direction === 'up' ? (
            <ArrowUpOutlined style={{ color: '#3f8600', marginRight: 4 }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#cf1322', marginRight: 4 }} />
          )}
          <span style={{ color: getTrendColor(trend.direction) }}>
            {trend.value}%
          </span>
          <span style={{ color: '#999', marginLeft: 4 }}>vs last period</span>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;


