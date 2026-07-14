import React from 'react';
import { Card, Typography, Row, Col, Button, Space, Divider } from 'antd';
import { MailOutlined, LinkOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import config from '../config/env';

const { Title, Paragraph, Text } = Typography;

const SUPPORT_EMAIL = 'support@icreationsglobal.com';

const SupportPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #003d82 0%, #1a5aad 50%, #ff9800 100%)',
        padding: '24px 16px',
      }}
    >
      <Row justify="center">
        <Col xs={24} sm={22} md={18} lg={12} xl={10}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img
              src={config.app.logoPath}
              alt="BestDeal Shipping"
              style={{ width: 100, height: 'auto', objectFit: 'contain', marginBottom: 12 }}
            />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Support
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              BestDeal Shipping / ShipEASE help
            </Text>
          </div>

          <Card style={{ borderRadius: 12 }}>
            <Typography>
              <Paragraph>
                Need help with the BestDeal Shipping mobile app or web dashboard? Our team can assist
                with account access, job tracking, deliveries, and technical issues.
              </Paragraph>

              <Title level={4}>Email support</Title>
              <Paragraph>
                Write to us at{' '}
                <a href={`mailto:${SUPPORT_EMAIL}?subject=BestDeal%20Shipping%20Support`}>
                  {SUPPORT_EMAIL}
                </a>
                . Include your name, organisation, and (if relevant) tracking or job ID so we can help
                faster.
              </Paragraph>

              <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<MailOutlined />}
                  size="large"
                  block
                  href={`mailto:${SUPPORT_EMAIL}?subject=BestDeal%20Shipping%20Support`}
                  style={{ background: '#ff9800', borderColor: '#ff9800' }}
                >
                  Email {SUPPORT_EMAIL}
                </Button>
              </Space>

              <Title level={4}>What we can help with</Title>
              <Paragraph>
                • Login, password reset, and invitation issues
                <br />
                • Job status, tracking, and proof of delivery questions
                <br />
                • App permissions (camera, location, notifications)
                <br />
                • Bugs or unexpected behaviour in the app or dashboard
              </Paragraph>

              <Title level={4}>Response times</Title>
              <Paragraph>
                We aim to respond during normal business hours. Urgent operational issues (for example
                active collections or deliveries) should include &quot;Urgent&quot; in the subject line
                and a job or tracking reference.
              </Paragraph>

              <Divider />

              <Paragraph style={{ marginBottom: 8 }}>
                <Link to="/privacy">
                  <LinkOutlined /> Privacy Policy
                </Link>
              </Paragraph>
              <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                Public tracking (no login):{' '}
                <Link to="/track">bestdealshippingapp.com/track</Link>
              </Paragraph>
            </Typography>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupportPage;
