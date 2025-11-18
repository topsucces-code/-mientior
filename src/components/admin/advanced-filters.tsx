'use client'

import React, { useState } from 'react'
import {
  Drawer,
  Form,
  Input,
  Select,
  Slider,
  InputNumber,
  Checkbox,
  Button,
  Space,
  Modal,
  message,
} from 'antd'
import { FilterOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface AdvancedFiltersProps {
  resource: string
  visible: boolean
  onClose: () => void
  onFiltersChange: (filters: Record<string, unknown>) => void
  initialFilters?: Record<string, unknown>
}

interface FilterConfig {
  type: 'input' | 'select' | 'slider' | 'number-range' | 'checkbox' | 'async-select'
  label: string
  field: string
  options?: { label: string; value: string | number | boolean }[]
  apiEndpoint?: string
  min?: number
  max?: number
  step?: number
}

const FILTER_CONFIGS: Record<string, FilterConfig[]> = {
  products: [
    { type: 'input', label: 'Product Name', field: 'name' },
    { type: 'async-select', label: 'Category', field: 'categoryId', apiEndpoint: '/api/categories' },
    {
      type: 'select',
      label: 'Status',
      field: 'status',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Archived', value: 'ARCHIVED' },
      ],
    },
    { type: 'slider', label: 'Price Range', field: 'price', min: 0, max: 10000, step: 100 },
    { type: 'number-range', label: 'Stock Range', field: 'stock' },
    { type: 'checkbox', label: 'Featured Only', field: 'featured' },
  ],
  orders: [
    { type: 'input', label: 'Order Number', field: 'orderNumber' },
    {
      type: 'select',
      label: 'Status',
      field: 'status',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Processing', value: 'PROCESSING' },
        { label: 'Shipped', value: 'SHIPPED' },
        { label: 'Delivered', value: 'DELIVERED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
    { type: 'async-select', label: 'Customer', field: 'userId', apiEndpoint: '/api/users' },
    { type: 'slider', label: 'Total Amount', field: 'total', min: 0, max: 50000, step: 500 },
  ],
  users: [
    { type: 'input', label: 'Email', field: 'email' },
    { type: 'input', label: 'Name', field: 'name' },
    {
      type: 'select',
      label: 'Loyalty Level',
      field: 'loyaltyLevel',
      options: [
        { label: 'Bronze', value: 'BRONZE' },
        { label: 'Silver', value: 'SILVER' },
        { label: 'Gold', value: 'GOLD' },
        { label: 'Platinum', value: 'PLATINUM' },
      ],
    },
  ],
  categories: [
    { type: 'input', label: 'Category Name', field: 'name' },
    { type: 'checkbox', label: 'Active Only', field: 'isActive' },
    { type: 'async-select', label: 'Parent Category', field: 'parentId', apiEndpoint: '/api/categories' },
  ],
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  resource,
  visible,
  onClose,
  onFiltersChange,
  initialFilters = {},
}) => {
  const { t } = useTranslation(['common', 'admin'])
  const [form] = Form.useForm()
  const [saveViewModal, setSaveViewModal] = useState(false)
  const [saveViewForm] = Form.useForm()

  const filterConfig = FILTER_CONFIGS[resource] || []

  const handleApply = () => {
    const values = form.getFieldsValue()
    // Clean up empty values
    const cleanedFilters = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)
    
    onFiltersChange(cleanedFilters)
    message.success(t('admin.filters.applied'))
    onClose()
  }

  const handleReset = () => {
    form.resetFields()
    onFiltersChange({})
    message.info(t('admin.filters.reset'))
  }

  const handleSaveView = async () => {
    try {
      const viewData = await saveViewForm.validateFields()
      const filters = form.getFieldsValue()
      
      // Call API to save view
      const response = await fetch('/api/admin/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource,
          name: viewData.name,
          filters,
          isDefault: viewData.isDefault || false,
        }),
      })

      if (response.ok) {
        message.success(t('admin.views.saved'))
        setSaveViewModal(false)
        saveViewForm.resetFields()
      }
    } catch (error) {
      message.error(t('admin.views.saveFailed'))
    }
  }

  const renderFilterField = (config: FilterConfig) => {
    switch (config.type) {
      case 'input':
        return (
          <Form.Item key={config.field} name={config.field} label={config.label}>
            <Input placeholder={`Enter ${config.label}`} />
          </Form.Item>
        )

      case 'select':
        return (
          <Form.Item key={config.field} name={config.field} label={config.label}>
            <Select
              mode="multiple"
              placeholder={`Select ${config.label}`}
              options={config.options}
              allowClear
            />
          </Form.Item>
        )

      case 'async-select':
        return (
          <Form.Item key={config.field} name={config.field} label={config.label}>
            <AsyncSelect apiEndpoint={config.apiEndpoint!} />
          </Form.Item>
        )

      case 'slider':
        return (
          <Form.Item key={config.field} name={config.field} label={config.label}>
            <Slider
              range
              min={config.min}
              max={config.max}
              step={config.step}
              marks={{
                [config.min!]: `$${config.min}`,
                [config.max!]: `$${config.max}`,
              }}
            />
          </Form.Item>
        )

      case 'number-range':
        return (
          <Form.Item key={config.field} label={config.label}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name={[config.field, 'min']} noStyle>
                <InputNumber placeholder="Min" style={{ width: '50%' }} />
              </Form.Item>
              <Form.Item name={[config.field, 'max']} noStyle>
                <InputNumber placeholder="Max" style={{ width: '50%' }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        )

      case 'checkbox':
        return (
          <Form.Item key={config.field} name={config.field} valuePropName="checked">
            <Checkbox>{config.label}</Checkbox>
          </Form.Item>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Drawer
        title={
          <Space>
            <FilterOutlined />
            {t('admin.filters.advanced')} - {resource}
          </Space>
        }
        placement="right"
        width={500}
        onClose={onClose}
        open={visible}
        footer={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={handleReset}>{t('buttons.reset')}</Button>
            <Space>
              <Button icon={<SaveOutlined />} onClick={() => setSaveViewModal(true)}>
                {t('admin.views.save')}
              </Button>
              <Button type="primary" onClick={handleApply}>
                {t('buttons.apply')}
              </Button>
            </Space>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={initialFilters}>
          {filterConfig.map((config) => renderFilterField(config))}
        </Form>
      </Drawer>

      <Modal
        title={t('admin.views.saveAs')}
        open={saveViewModal}
        onOk={handleSaveView}
        onCancel={() => setSaveViewModal(false)}
      >
        <Form form={saveViewForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('admin.views.name')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input placeholder="e.g., High Value Orders" />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>{t('admin.views.setDefault')}</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// Helper component for async select
const AsyncSelect: React.FC<{ apiEndpoint: string }> = ({ apiEndpoint }) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)

  const fetchOptions = React.useCallback(async (search: string = '') => {
    setLoading(true)
    try {
      const response = await fetch(`${apiEndpoint}?search=${search}&_limit=20`)
      const data = await response.json()
      
      interface DataItem {
        id: string
        name?: string
        email?: string
        title?: string
      }
      
      const formattedOptions = (data.data as DataItem[] || []).map((item: DataItem) => ({
        label: item.name || item.email || item.title || `${item.id}`,
        value: item.id,
      }))
      
      setOptions(formattedOptions)
    } catch (error) {
      console.error('Failed to fetch options:', error)
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint])

  React.useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  return (
    <Select
      showSearch
      loading={loading}
      options={options}
      onSearch={(value) => fetchOptions(value)}
      filterOption={false}
      placeholder="Search and select..."
      allowClear
    />
  )
}
