import React from 'react';
import { Card, Typography, Row, Col, Divider } from 'antd';
import { Link } from 'react-router-dom';
import config from '../config/env';

const { Title, Paragraph, Text } = Typography;

const SUPPORT_EMAIL = 'support@icreationsglobal.com';
const LAST_UPDATED = '14 July 2026';

const sectionStyle = { marginBottom: 8 };

const PrivacyPolicyPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #003d82 0%, #1a5aad 50%, #ff9800 100%)',
        padding: '24px 16px',
      }}
    >
      <Row justify="center">
        <Col xs={24} sm={22} md={20} lg={16} xl={14}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img
              src={config.app.logoPath}
              alt="BestDeal Shipping"
              style={{ width: 100, height: 'auto', objectFit: 'contain', marginBottom: 12 }}
            />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Privacy Policy
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              BestDeal Shipping (ShipEASE) · Last updated {LAST_UPDATED}
            </Text>
          </div>

          <Card style={{ borderRadius: 12 }}>
            <Typography>
              <Paragraph>
                BestDeal Shipping (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the BestDeal Shipping /
                ShipEASE mobile application and related web services (the &quot;Service&quot;). This Privacy
                Policy explains what information we collect, how we use it, and your choices. It is
                provided for transparency and App Store compliance; it is not legal advice.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                1. Who this applies to
              </Title>
              <Paragraph>
                This policy covers staff and authorised users of our logistics platform (drivers,
                warehouse staff, delivery agents, administrators, and customer-service roles) and
                anyone who contacts us for support.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                2. Information we collect
              </Title>
              <Paragraph>
                Depending on how you use the Service, we may collect:
              </Paragraph>
              <Paragraph>
                <strong>Account data:</strong> name, email address, phone number, organisation or
                role, and authentication credentials (passwords are stored in hashed form).
              </Paragraph>
              <Paragraph>
                <strong>Operational / shipment data:</strong> customer and consignee details, pickup
                and delivery addresses, tracking identifiers, job status history, invoices, and related
                logistics notes needed to fulfil collections and deliveries.
              </Paragraph>
              <Paragraph>
                <strong>Location data:</strong> with your permission, device location while in use
                (for example to show pickup and delivery locations on a map during active jobs). We
                do not use background tracking for advertising.
              </Paragraph>
              <Paragraph>
                <strong>Camera and photos:</strong> with your permission, photos and images you
                capture or select as proof of collection or delivery. These may be stored with the
                related job record.
              </Paragraph>
              <Paragraph>
                <strong>Push notifications:</strong> device push tokens so we can send job and status
                alerts. You can disable notifications in device or app settings.
              </Paragraph>
              <Paragraph>
                <strong>Technical data:</strong> approximate device/app version, IP address, and
                diagnostic logs needed to operate and secure the Service.
              </Paragraph>
              <Paragraph>
                <strong>Support communications:</strong> content you send us by email or other contact
                channels when you request help.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                3. How we use information
              </Title>
              <Paragraph>
                We use personal data to provide and improve the Service, including: authenticating
                users; managing shipments, collections, and deliveries; generating proofs of
                delivery; sending operational notifications; providing customer support; preventing
                fraud or misuse; and complying with legal obligations.
              </Paragraph>
              <Paragraph>
                We do not sell your personal information. We do not use your location, photos, or
                shipment data for third-party advertising.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                4. Sharing of information
              </Title>
              <Paragraph>
                Data may be shared with: authorised members of your organisation using the Service;
                service providers that host our infrastructure or deliver email/push notifications
                (under contractual obligations); and authorities when required by law. Recipients and
                carriers involved in a shipment may receive the delivery details needed to complete
                that shipment.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                5. Data retention
              </Title>
              <Paragraph>
                We retain account and operational records for as long as needed to provide the
                Service, meet accounting and logistics record-keeping needs, resolve disputes, and
                comply with applicable law. When data is no longer required, we delete or anonymise it
                where reasonably practicable.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                6. Security
              </Title>
              <Paragraph>
                We use reasonable technical and organisational measures to protect personal data,
                including encrypted transit (HTTPS), access controls, and hashed passwords. No method
                of transmission or storage is completely secure; please protect your login credentials.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                7. Your choices and rights
              </Title>
              <Paragraph>
                You may update profile details in the app where available, revoke camera/location/
                notification permissions in your device settings, and request access, correction, or
                deletion of personal data by contacting us (subject to legal and operational
                retention requirements). Organisation administrators control team membership and
                invitations.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                8. Children
              </Title>
              <Paragraph>
                The Service is intended for authorised business and logistics users and is not
                directed at children under 16. We do not knowingly collect personal information from
                children.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                9. International transfers
              </Title>
              <Paragraph>
                BestDeal Shipping operates logistics between regions (including the UK and Ghana).
                Data may be processed in countries where we or our hosting providers operate. We take
                steps appropriate to the nature of the transfer and our provider arrangements.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                10. Changes to this policy
              </Title>
              <Paragraph>
                We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date
                at the top will change when we do. Continued use of the Service after an update means
                you accept the revised policy where permitted by law.
              </Paragraph>

              <Title level={4} style={sectionStyle}>
                11. Contact
              </Title>
              <Paragraph>
                Questions about privacy or data requests:{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                <br />
                Support page:{' '}
                <Link to="/support">https://bestdealshippingapp.com/support</Link>
              </Paragraph>

              <Divider />
              <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                This document is a general description of our practices for users of the BestDeal
                Shipping / ShipEASE apps and is not a substitute for legal advice.
              </Paragraph>
            </Typography>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PrivacyPolicyPage;
