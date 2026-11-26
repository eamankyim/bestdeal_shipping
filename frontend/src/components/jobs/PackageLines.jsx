import React from 'react';
import { AutoComplete, Button, Col, Form, Input, InputNumber, Row, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { previewTotals } from '../../utils/packages';

const TYPES = ['Box', 'Bag', 'Barrel', 'Carton', 'Suitcase', 'Envelope', 'Other'].map((value) => ({ value }));

/**
 * What is in a job, one line per kind of item ("3 boxes of Sugar"), so part of a job can go in a
 * batch and the rest later. Weight and price are for one item. Use inside a Form; the lines are
 * saved as `packages`. `keep` lines (the ones already saved) cannot be removed: edits never delete.
 */
const PackageLines = ({ name = 'packages', showPrice = true, keep = 0 }) => (
  <Form.List
    name={name}
    rules={[{
      validator: async (_, lines) => {
        if (!lines || lines.length === 0) throw new Error('Add at least one item');
      },
    }]}
  >
    {(fields, { add, remove }, { errors }) => (
      <>
        {fields.map(({ key, name: index }) => {
          const first = index === 0;
          return (
            <Row key={key} gutter={8} align="bottom">
              <Col xs={24} md={showPrice ? 7 : 9}>
                <Form.Item name={[index, 'description']} label={first ? 'Item' : undefined} rules={[{ required: true, whitespace: true, message: 'What is it?' }]} style={{ marginBottom: 12 }}>
                  <Input placeholder="e.g. Sugar" aria-label={`Item ${index + 1}`} />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name={[index, 'packageType']} label={first ? 'Packed in' : undefined} style={{ marginBottom: 12 }}>
                  <AutoComplete options={TYPES} placeholder="Box" aria-label={`Packed in ${index + 1}`} filterOption={(input, option) => option.value.toLowerCase().startsWith(input.toLowerCase())} />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item name={[index, 'quantity']} label={first ? 'How many' : undefined} rules={[{ required: true, message: 'How many?' }]} style={{ marginBottom: 12 }}>
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} aria-label={`How many ${index + 1}`} />
                </Form.Item>
              </Col>
              <Col xs={12} md={showPrice ? 4 : 6}>
                <Form.Item name={[index, 'weight']} label={first ? 'Weight each (kg)' : undefined} style={{ marginBottom: 12 }}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} aria-label={`Weight each ${index + 1}`} />
                </Form.Item>
              </Col>
              {showPrice && (
                <Col xs={10} md={4}>
                  <Form.Item name={[index, 'estimatedPrice']} label={first ? 'Price each (£)' : undefined} style={{ marginBottom: 12 }}>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} aria-label={`Price each ${index + 1}`} />
                  </Form.Item>
                </Col>
              )}
              <Col xs={2} md={2}>
                {index >= keep && fields.length > 1 && (
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Remove item ${index + 1}`} onClick={() => remove(index)} style={{ marginBottom: 12 }} />
                )}
              </Col>
            </Row>
          );
        })}
        <Form.ErrorList errors={errors} />
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ quantity: 1 })} block>
          Add another item
        </Button>
        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const totals = previewTotals(getFieldValue(name));
            return totals.items > 0 && (
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                {totals.items} item{totals.items === 1 ? '' : 's'}
                {totals.weight !== null && ` · ${Math.round(totals.weight * 100) / 100} kg`}
                {showPrice && totals.value !== null && ` · £${totals.value.toFixed(2)}`}
              </Typography.Text>
            );
          }}
        </Form.Item>
      </>
    )}
  </Form.List>
);

export default PackageLines;
