import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, InputNumber, Modal, Row, Space, Spin, Statistic, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, WalletOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../utils/api';

const { Text, Paragraph } = Typography;

// The payment an administrator went to Lynk's page for, checked with Lynk when they come back
const PENDING_KEY = 'bestdeal_lynk_payment';
const readPending = () => {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    // A payment page left for more than a day is not followed up here any more
    return pending && Date.now() - pending.at < 24 * 3600 * 1000 ? pending : null;
  } catch (error) {
    return null;
  }
};
const forgetPending = () => localStorage.removeItem(PENDING_KEY);

export const money = (cents, currency = 'GHS') => {
  const amount = (Number(cents) || 0) / 100;
  try {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};
const day = (value) => (value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const count = (value) => Number(value || 0).toLocaleString();
const newRequestId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);

/** Sends the administrator to Lynk's payment page (mobile money or card), remembering what for. */
const goToPayment = (paymentUrl, pending) => {
  localStorage.setItem(PENDING_KEY, JSON.stringify({ ...pending, at: Date.now() }));
  window.location.assign(paymentUrl);
};

/**
 * Loads the plan for the Customer Messages settings: { plan, loading, reload }.
 * `plan` is { connected, problem, account, canPay } from GET /settings/messaging-plan.
 */
export const useMessagingPlan = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getMessagingPlan();
      setPlan(response.data);
    } catch (error) {
      setPlan({ connected: false, problem: error.message || 'Could not load the messaging plan' });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { plan, loading, reload };
};

/** The renewal the balance will not pay for, if any: shown on every Customer Messages tab. */
export const RenewalWarning = ({ plan, onPayAhead }) => {
  const account = plan?.connected ? plan.account : null;
  if (!account?.renews || account.renews.coveredByBalance !== false) return null;
  const planName = account.plans.find((item) => item.key === account.renews.plan)?.name || account.plan?.name || 'messaging';
  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message={`Your ${planName} plan renews on ${day(account.renews.on)}, but the Lynk balance does not cover it`}
      description={`It needs ${money(account.renews.amountCents, account.currency)} and the balance is ${money(account.balanceCents, account.currency)}. Pay ahead so texts and emails to customers keep going.`}
      action={plan.canPay && onPayAhead && <Button type="primary" onClick={onPayAhead}>Pay Ahead</Button>}
    />
  );
};

/** Pay ahead onto the Lynk balance, in cedis. The plan prices (from Lynk) are offered as quick amounts. */
const PayAheadModal = ({ open, account, onClose }) => {
  const [cedis, setCedis] = useState(null);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (open) setCedis(null);
  }, [open]);

  const pay = async () => {
    const amountCents = Math.round(Number(cedis) * 100);
    if (!amountCents || amountCents < 100) {
      message.error('Enter an amount to pay');
      return;
    }
    setSending(true);
    try {
      const response = await settingsAPI.payAheadForMessaging(amountCents);
      const { paymentUrl, topUpId } = response.data;
      goToPayment(paymentUrl, { topUpId, what: `${money(amountCents, account.currency)} paid ahead` });
    } catch (error) {
      message.error(error.message || 'Could not start the payment');
      setSending(false);
    }
  };

  return (
    <Modal
      title="Pay Ahead for Messaging"
      open={open}
      onCancel={onClose}
      onOk={pay}
      okText="Go to Payment"
      confirmLoading={sending}
      destroyOnClose
    >
      <Paragraph type="secondary">
        The money goes onto BestDeal's Lynk balance. Lynk renews the plan from it each month by itself.
        You pay on Lynk's page, by mobile money or card, then come back here.
      </Paragraph>
      <Space wrap style={{ marginBottom: 12 }}>
        {account.plans.map((item) => (
          <Button key={item.key} onClick={() => setCedis(item.amountCents / 100)}>
            {money(item.amountCents, account.currency)} ({item.name})
          </Button>
        ))}
      </Space>
      <InputNumber
        aria-label="Amount to pay"
        style={{ width: '100%' }}
        min={1}
        precision={2}
        value={cedis}
        onChange={setCedis}
        addonBefore={account.currency === 'GHS' ? 'GH₵' : account.currency}
        placeholder="Amount"
      />
    </Modal>
  );
};

/** Settings → Customer Messages → Messaging Plan. Prices and plans always come from Lynk. */
const MessagingPlan = ({ plan, loading, reload, onOpenSetup, payAheadOpen, setPayAheadOpen }) => {
  const [choosing, setChoosing] = useState(null); // { plan, requestId }
  const [sending, setSending] = useState(false);
  const [payment, setPayment] = useState(null); // what Lynk says about the payment just made

  // Coming back from Lynk's payment page: ask Lynk whether it went through (the link proves nothing)
  const checkPayment = useCallback(async () => {
    const pending = readPending();
    if (!pending) return;
    setPayment({ status: 'checking', what: pending.what });
    try {
      const response = await settingsAPI.checkMessagingPayment(pending.topUpId);
      const { status } = response.data;
      setPayment({ status, what: pending.what });
      if (status !== 'pending') {
        forgetPending();
        if (status === 'paid') {
          message.success('Payment received');
          reload();
        }
      }
    } catch (error) {
      setPayment({ status: 'unknown', what: pending.what, error: error.message });
      if (error.status === 404 || error.status === 403) forgetPending();
    }
  }, [reload]);

  useEffect(() => {
    if (plan?.canPay) checkPayment();
    // The return link has done its job
    if (window.location.search.includes('lynk_payment')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [plan?.canPay, checkPayment]);

  if (!plan) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;

  if (!plan.connected) {
    return (
      <Alert
        type="warning"
        showIcon
        message="The messaging plan cannot be shown"
        description={plan.problem}
        action={(
          <Space direction="vertical">
            {onOpenSetup && <Button onClick={onOpenSetup}>SMS & Email Setup</Button>}
            <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>Try Again</Button>
          </Space>
        )}
      />
    );
  }

  const { account, canPay } = plan;
  const current = account.plan;
  const renewsName = account.renews && (account.plans.find((item) => item.key === account.renews.plan)?.name || account.renews.plan);

  const choose = async () => {
    setSending(true);
    try {
      const response = await settingsAPI.chooseMessagingPlan(choosing.plan.key, choosing.requestId);
      const answer = response.data;
      if (answer.status === 'payment_needed') {
        goToPayment(answer.paymentUrl, { topUpId: answer.topUpId, what: `the ${choosing.plan.name} plan` });
        return;
      }
      setChoosing(null);
      if (answer.status === 'on') message.success(`The ${choosing.plan.name} plan has started`);
      else message.success(`The ${choosing.plan.name} plan starts at the next renewal${answer.startsOn ? `, on ${day(answer.startsOn)}` : ''}. Nothing is paid now.`);
      reload();
    } catch (error) {
      // The same request id is kept, so trying again cannot choose the plan twice
      message.error(error.message || 'Could not choose the plan');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {payment?.status === 'checking' && <Alert type="info" showIcon style={{ marginBottom: 16 }} message={`Checking the payment for ${payment.what} with Lynk…`} />}
      {payment?.status === 'paid' && <Alert type="success" showIcon closable style={{ marginBottom: 16 }} message={`Lynk has received the payment for ${payment.what}.`} />}
      {payment?.status === 'failed' && <Alert type="error" showIcon closable style={{ marginBottom: 16 }} message={`The payment for ${payment.what} did not go through.`} description="You can try again below." />}
      {payment?.status === 'pending' && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Lynk has not confirmed the payment for ${payment.what} yet`}
          description="Mobile money can take a minute or two."
          action={<Button onClick={checkPayment}>Check Again</Button>}
        />
      )}
      {payment?.status === 'unknown' && <Alert type="warning" showIcon closable style={{ marginBottom: 16 }} message="Could not check the payment" description={payment.error} action={<Button onClick={checkPayment}>Check Again</Button>} />}

      {!current && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No messaging plan yet"
          description="Texts and emails to customers come out of a monthly plan. Choose one below."
        />
      )}

      <Card
        title="This Month"
        style={{ marginBottom: 16 }}
        extra={<Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>Refresh</Button>}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}><Statistic title="Texts left" value={count(account.textsLeft)} /></Col>
          <Col xs={12} md={6}><Statistic title="Emails left" value={count(account.emailsLeft)} /></Col>
          <Col xs={12} md={6}><Statistic title="Plan" value={current?.name || 'None'} /></Col>
          <Col xs={12} md={6}><Statistic title="Lynk balance" value={money(account.balanceCents, account.currency)} /></Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          {account.renews && (
            <Paragraph style={{ marginBottom: 4 }}>
              Renews on <Text strong>{day(account.renews.on)}</Text>
              {renewsName && <> as <Text strong>{renewsName}</Text></>}
              {account.renews.amountCents != null && <> for <Text strong>{money(account.renews.amountCents, account.currency)}</Text></>}
              {account.renews.coveredByBalance === true && <Tag color="success" style={{ marginLeft: 8 }}>Balance covers it</Tag>}
              {account.renews.coveredByBalance === false && <Tag color="warning" style={{ marginLeft: 8 }}>Balance too low</Tag>}
            </Paragraph>
          )}
          {account.endsOn && <Paragraph style={{ marginBottom: 4 }}>The plan ends on <Text strong>{day(account.endsOn)}</Text>.</Paragraph>}
          <Text type="secondary">
            {account.textsPastPlanFromBalance
              ? 'When the plan\'s texts run out, each further text is paid from the Lynk balance.'
              : 'When the plan\'s texts run out, texts stop until the plan renews or a bigger plan starts.'}
          </Text>
        </div>
        {canPay && (
          <div style={{ marginTop: 16 }}>
            <Button icon={<WalletOutlined />} onClick={() => setPayAheadOpen(true)}>Pay Ahead</Button>
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {account.plans.map((item) => {
          const isCurrent = current?.key === item.key;
          return (
            <Col xs={24} md={8} key={item.key}>
              <Card
                title={item.name}
                extra={isCurrent && <Tag color="blue" icon={<CheckCircleOutlined />}>Current plan</Tag>}
                style={isCurrent ? { borderColor: '#1890ff' } : undefined}
              >
                <Statistic value={money(item.amountCents, account.currency)} suffix={<Text type="secondary" style={{ fontSize: 14 }}>a month</Text>} />
                <Paragraph style={{ marginTop: 12, marginBottom: 16 }}>
                  {count(item.texts)} texts<br />
                  {count(item.emails)} emails
                </Paragraph>
                {canPay && (
                  <Button
                    type={isCurrent ? 'default' : 'primary'}
                    block
                    disabled={isCurrent}
                    onClick={() => setChoosing({ plan: item, requestId: newRequestId() })}
                  >
                    {isCurrent ? 'Your Plan' : 'Choose'}
                  </Button>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
      {!canPay && <Paragraph type="secondary" style={{ marginTop: 16 }}>Only an administrator can choose a plan or pay.</Paragraph>}

      <Modal
        title={choosing ? `Choose ${choosing.plan.name}?` : ''}
        open={Boolean(choosing)}
        onCancel={() => !sending && setChoosing(null)}
        onOk={choose}
        okText="Choose Plan"
        confirmLoading={sending}
      >
        {choosing && (
          <>
            <Paragraph>
              <Text strong>{money(choosing.plan.amountCents, account.currency)} a month</Text>: {count(choosing.plan.texts)} texts and {count(choosing.plan.emails)} emails.
            </Paragraph>
            <Paragraph type="secondary">
              {current
                ? `${current.name} is running now, so ${choosing.plan.name} starts at the next renewal${account.renews?.on ? ` on ${day(account.renews.on)}` : ''}. Nothing is paid now.`
                : 'It is paid from the Lynk balance when the balance covers it. Otherwise you go to Lynk\'s payment page (mobile money or card) and the plan starts once it is paid.'}
            </Paragraph>
          </>
        )}
      </Modal>

      {canPay && <PayAheadModal open={payAheadOpen} account={account} onClose={() => setPayAheadOpen(false)} />}
    </div>
  );
};

export default MessagingPlan;
