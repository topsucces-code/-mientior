'use client'

import React, { useState } from 'react'
import { Button, Space, Modal, Select, message, Popconfirm, Form } from 'antd'
import { DeleteOutlined, EditOutlined, ExportOutlined, CloseOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useUpdateMany, useDeleteMany } from '@refinedev/core'

interface BulkActionsProps {
  resource: string
  selectedRowKeys: React.Key[]
  onClearSelection: () => void
  statusOptions?: { label: string; value: string }[]
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  resource,
  selectedRowKeys,
  onClearSelection,
  statusOptions = [],
}) => {
  const { t } = useTranslation(['common', 'admin'])
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [form] = Form.useForm()

  const { mutate: updateMany } = useUpdateMany()
  const { mutate: deleteMany } = useDeleteMany()

  if (selectedRowKeys.length === 0) {
    return null
  }

  const handleStatusChange = async () => {
    try {
      const values = await form.validateFields()
      
      updateMany(
        {
          resource,
          ids: selectedRowKeys.map(String),
          values: { status: values.status },
        },
        {
          onSuccess: () => {
            message.success(t('admin.bulk.statusUpdated', { count: selectedRowKeys.length }))
            setStatusModalOpen(false)
            form.resetFields()
            onClearSelection()
          },
          onError: () => {
            message.error(t('admin.bulk.statusFailed'))
          },
        }
      )
    } catch (error) {
      // Validation failed
    }
  }

  const handleDelete = () => {
    deleteMany(
      {
        resource,
        ids: selectedRowKeys.map(String),
      },
      {
        onSuccess: () => {
          message.success(t('admin.bulk.deleted', { count: selectedRowKeys.length }))
          onClearSelection()
        },
        onError: () => {
          message.error(t('admin.bulk.deleteFailed'))
        },
      }
    )
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource,
          ids: selectedRowKeys,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${resource}-export-${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        message.success(t('admin.bulk.exported', { count: selectedRowKeys.length }))
      } else {
        message.error(t('admin.bulk.exportFailed'))
      }
    } catch (error) {
      message.error(t('admin.bulk.exportFailed'))
    }
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: '#fff',
          padding: '16px 24px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Space>
          <strong>
            {selectedRowKeys.length} {t('admin.bulk.selected')}
          </strong>

          {statusOptions.length > 0 && (
            <Button
              icon={<EditOutlined />}
              onClick={() => setStatusModalOpen(true)}
            >
              {t('admin.bulk.changeStatus')}
            </Button>
          )}

          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            {t('admin.bulk.export')}
          </Button>

          <Popconfirm
            title={t('admin.bulk.deleteConfirm', { count: selectedRowKeys.length })}
            onConfirm={handleDelete}
            okText={t('buttons.yes')}
            cancelText={t('buttons.no')}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t('buttons.delete')}
            </Button>
          </Popconfirm>

          <Button
            icon={<CloseOutlined />}
            onClick={onClearSelection}
          >
            {t('buttons.clear')}
          </Button>
        </Space>
      </div>

      <Modal
        title={t('admin.bulk.changeStatus')}
        open={statusModalOpen}
        onOk={handleStatusChange}
        onCancel={() => setStatusModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label={t('admin.fields.status')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select
              placeholder={t('admin.bulk.selectStatus')}
              options={statusOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
