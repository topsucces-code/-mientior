'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Tag, Card, Input, Modal, Form, message, Popconfirm, Typography, Switch, Select, Tree, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MenuOutlined, LinkOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useDelete } from '@refinedev/core';
import type { DataNode } from 'antd/es/tree';

const { Title, Text } = Typography;

interface MenuItem {
  id: string;
  label: string;
  url?: string;
  icon?: string;
  target?: string;
  order: number;
  parentId?: string;
  isActive: boolean;
  children?: MenuItem[];
}

interface Menu {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

const menuLocations = [
  { value: 'main', label: '🔝 Main Navigation' },
  { value: 'footer', label: '⬇️ Footer' },
  { value: 'mobile', label: '📱 Mobile Menu' },
  { value: 'sidebar', label: '📐 Sidebar' },
  { value: 'account', label: '👤 Account Menu' },
];

export default function MenusPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [menuForm] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { tableProps } = useTable<Menu>({
    resource: 'menus',
    pagination: { pageSize: 10 },
  });

  const { mutate: createMenu } = useCreate();
  const { mutate: updateMenu } = useUpdate();
  const { mutate: deleteMenu } = useDelete();

  const handleCreateMenu = () => {
    setEditingMenu(null);
    menuForm.resetFields();
    menuForm.setFieldsValue({ isActive: true });
    setMenuModalVisible(true);
  };

  const handleEditMenu = (record: Menu) => {
    setEditingMenu(record);
    menuForm.setFieldsValue(record);
    setMenuModalVisible(true);
  };

  const handleDeleteMenu = (id: string) => {
    deleteMenu({ resource: 'menus', id }, {
      onSuccess: () => message.success('Menu deleted'),
    });
  };

  const handleManageItems = (menu: Menu) => {
    setSelectedMenu(menu);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    itemForm.resetFields();
    itemForm.setFieldsValue({ isActive: true, target: '_self', order: 0 });
    setItemModalVisible(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    itemForm.setFieldsValue(item);
    setItemModalVisible(true);
  };

  const handleSubmitMenu = async () => {
    try {
      const values = await menuForm.validateFields();

      setSubmitting(true);
      if (editingMenu) {
        updateMenu({ resource: 'menus', id: editingMenu.id, values }, {
          onSuccess: () => {
            message.success('Menu updated');
            setMenuModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      } else {
        createMenu({ resource: 'menus', values }, {
          onSuccess: () => {
            message.success('Menu created');
            setMenuModalVisible(false);
            setSubmitting(false);
          },
          onError: () => setSubmitting(false),
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setSubmitting(false);
    }
  };

  const handleSubmitItem = async () => {
    try {
      await itemForm.validateFields();
      message.success(editingItem ? 'Item updated' : 'Item added');
      setItemModalVisible(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const convertToTreeData = (items: MenuItem[]): DataNode[] => {
    return items.map(item => ({
      key: item.id,
      title: (
        <Space>
          <Text>{item.label}</Text>
          {item.url && <Text type="secondary" style={{ fontSize: 12 }}>{item.url}</Text>}
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditItem(item)} />
        </Space>
      ),
      children: item.children ? convertToTreeData(item.children) : undefined,
    }));
  };

  const columns = [
    {
      title: t('admin:cms.menus.name', 'Menu Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: t('admin:cms.menus.location', 'Location'),
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => {
        const loc = menuLocations.find(l => l.value === location);
        return <Tag>{loc?.label || location}</Tag>;
      },
    },
    {
      title: t('admin:cms.menus.items', 'Items'),
      key: 'items',
      render: (_: unknown, record: Menu) => (
        <Tag color="blue">{record.items?.length || 0} items</Tag>
      ),
    },
    {
      title: t('admin:cms.menus.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: t('admin:common.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: Menu) => (
        <Space>
          <Button type="link" icon={<AppstoreOutlined />} onClick={() => handleManageItems(record)}>
            Manage Items
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditMenu(record)} />
          <Popconfirm title="Delete this menu?" onConfirm={() => handleDeleteMenu(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}><MenuOutlined /> {t('admin:cms.menus.title', 'Navigation Menus')}</Title>
          <Text type="secondary">{t('admin:cms.menus.subtitle', 'Manage website navigation')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMenu}>
          {t('admin:cms.menus.create', 'Create Menu')}
        </Button>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={selectedMenu ? 14 : 24}>
          <Card>
            <Table {...tableProps} columns={columns} rowKey="id" />
          </Card>
        </Col>

        {selectedMenu && (
          <Col xs={24} lg={10}>
            <Card 
              title={
                <Space>
                  <AppstoreOutlined />
                  {selectedMenu.name} - Items
                </Space>
              }
              extra={
                <Space>
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddItem}>
                    Add Item
                  </Button>
                  <Button size="small" onClick={() => setSelectedMenu(null)}>
                    Close
                  </Button>
                </Space>
              }
            >
              {selectedMenu.items?.length > 0 ? (
                <Tree
                  treeData={convertToTreeData(selectedMenu.items)}
                  draggable
                  blockNode
                  defaultExpandAll
                />
              ) : (
                <Text type="secondary">No items yet. Add your first menu item.</Text>
              )}
            </Card>
          </Col>
        )}
      </Row>

      {/* Menu Modal */}
      <Modal
        title={editingMenu ? 'Edit Menu' : 'Create Menu'}
        open={menuModalVisible}
        onOk={handleSubmitMenu}
        onCancel={() => setMenuModalVisible(false)}
        confirmLoading={submitting}
      >
        <Form form={menuForm} layout="vertical">
          <Form.Item name="name" label="Menu Name" rules={[{ required: true }]}>
            <Input placeholder="Main Navigation" />
          </Form.Item>

          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Select options={menuLocations} />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Menu Item Modal */}
      <Modal
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        open={itemModalVisible}
        onOk={handleSubmitItem}
        onCancel={() => setItemModalVisible(false)}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input placeholder="Home" />
          </Form.Item>

          <Form.Item name="url" label="URL">
            <Input prefix={<LinkOutlined />} placeholder="/products" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="target" label="Target">
                <Select>
                  <Select.Option value="_self">Same Window</Select.Option>
                  <Select.Option value="_blank">New Window</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="order" label="Order">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="icon" label="Icon (optional)">
            <Input placeholder="home" />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
