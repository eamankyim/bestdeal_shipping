import React from 'react';
import { Row, Col, Typography } from 'antd';
import './DashboardLayout.css';

const { Title } = Typography;

/**
 * Shared Dashboard Layout Component
 * Provides consistent layout structure for all role-specific dashboards
 */
const DashboardLayout = ({ 
  title,
  subtitle,
  user,
  statsCards = [],
  mainContent,
  sideContent,
  children
}) => {
  return (
    <div className="dashboard-layout">
      {/* Header Section */}
      <div className="dashboard-header">
        <Title level={2} style={{ margin: 0 }}>
          {title || `Welcome back, ${user?.name || 'User'}`}
        </Title>
        {subtitle && (
          <p style={{ color: '#666', marginTop: 8 }}>{subtitle}</p>
        )}
      </div>

      {/* Stats Cards Row */}
      {statsCards.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statsCards.map((card, index) => (
            <Col 
              key={index}
              xs={12} 
              sm={12} 
              md={statsCards.length <= 3 ? 8 : 6}
            >
              {card}
            </Col>
          ))}
        </Row>
      )}

      {/* Main Content Area */}
      {(mainContent || sideContent) && (
        <Row gutter={[16, 16]}>
          {/* Main content (takes 2/3 on desktop) */}
          {mainContent && (
            <Col xs={24} lg={sideContent ? 16 : 24}>
              {mainContent}
            </Col>
          )}
          
          {/* Side content (takes 1/3 on desktop) */}
          {sideContent && (
            <Col xs={24} lg={8}>
              {sideContent}
            </Col>
          )}
        </Row>
      )}

      {/* Custom children content */}
      {children && (
        <div style={{ marginTop: 24 }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;




              {card}

            </Col>

          ))}

        </Row>

      )}



      {/* Main Content Area */}

      {(mainContent || sideContent) && (

        <Row gutter={[16, 16]}>

          {/* Main content (takes 2/3 on desktop) */}

          {mainContent && (

            <Col xs={24} lg={sideContent ? 16 : 24}>

              {mainContent}

            </Col>

          )}

          

          {/* Side content (takes 1/3 on desktop) */}

          {sideContent && (

            <Col xs={24} lg={8}>

              {sideContent}

            </Col>

          )}

        </Row>

      )}



      {/* Custom children content */}

      {children && (

        <div style={{ marginTop: 24 }}>

          {children}

        </div>

      )}

    </div>

  );

};



export default DashboardLayout;






