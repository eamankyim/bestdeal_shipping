import React from 'react';
import { Card, Button, Row, Col, Tooltip } from 'antd';

/**
 * Reusable Quick Actions Component
 * Shows role-specific quick action buttons
 */
const QuickActions = ({ 
  title = 'Quick Actions',
  actions = [],
  loading = false,
  columns = { xs: 24, sm: 12, md: 8, lg: 6 }
}) => {
  return (
    <Card 
      title={title}
      bordered={false}
      className="quick-actions-card"
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {actions.map((action, index) => (
          <Col key={index} {...columns}>
            <Tooltip title={action.tooltip}>
              <Button
                type={action.type || 'default'}
                icon={action.icon}
                size="large"
                block
                onClick={action.onClick}
                disabled={action.disabled}
                danger={action.danger}
                loading={action.loading}
                style={{
                  height: 'auto',
                  minHeight: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 8px',
                  ...action.style
                }}
              >
                <div style={{ marginTop: action.icon ? 8 : 0 }}>
                  {action.label}
                </div>
                {action.badge && (
                  <div style={{ 
                    fontSize: 12, 
                    color: '#999', 
                    marginTop: 4 
                  }}>
                    {action.badge}
                  </div>
                )}
              </Button>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickActions;


