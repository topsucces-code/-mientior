'use client'

import React, { useState } from 'react'
import { Select, Button, Space, Modal, Input, Checkbox, Form, message, Popconfirm } from 'antd'
import { StarOutlined, StarFilled, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useCreate, useUpdate, useDelete, useList } from '@refinedev/core'

interface SavedView {
  id: string
  name: string
  filters: Record<string, unknown>
  isDefault: boolean
  resource: string
}

interface SavedViewsSelectorProps {
  resource: string
  onViewSelect: (filters: Record<string, unknown>) => void
  currentFilters?: Record<string, unknown>
}

export const SavedViewsSelector: React.FC<SavedViewsSelectorProps> = ({
  resource,
  onViewSelect,
  currentFilters = {},
}) => {
  const [selectedView, setSelectedView] = useState<string | null>(null)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [updateForm] = Form.useForm()

  // Fetch saved views using useList
  const viewsList = useList<SavedView>({
    resource: 'saved-views',
    filters: [{ field: 'resource', operator: 'eq', value: resource }],
  })

  const { mutate: createView } = useCreate()
  const { mutate: updateView } = useUpdate()
  const { mutate: deleteView } = useDelete()

  const views: SavedView[] = viewsList?.result?.data || []
  const defaultView = views.find((v: SavedView) => v.isDefault)
  const isLoading = viewsList?.query?.isLoading || false
  const refetch = () => viewsList?.query?.refetch()

  // Load default view on mount
  React.useEffect(() => {
    if (defaultView && !selectedView) {
      setSelectedView(defaultView.id)
      onViewSelect(defaultView.filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultView?.id])

  const handleViewChange = (viewId: string) => {
    const view = views.find((v) => v.id === viewId)
    if (view) {
      setSelectedView(viewId)
      onViewSelect(view.filters)
      message.success(`View "${view.name}" loaded`)
    }
  }

  const handleSaveNewView = async () => {
    try {
      const values = await form.validateFields()
      createView(
        {
          resource: 'saved-views',
          values: {
            name: values.name,
            resource,
            filters: currentFilters,
            isDefault: values.isDefault || false,
          },
        },
        {
          onSuccess: () => {
            message.success('View saved successfully')
            setSaveModalOpen(false)
            form.resetFields()
            refetch()
          },
          onError: () => {
            message.error('Failed to save view')
          },
        }
      )
    } catch (error) {
      // Validation failed
    }
  }

  const handleUpdateView = async () => {
    if (!selectedView) return

    try {
      const values = await updateForm.validateFields()
      updateView(
        {
          resource: 'saved-views',
          id: selectedView,
          values: {
            name: values.name,
            filters: currentFilters,
            isDefault: values.isDefault,
          },
        },
        {
          onSuccess: () => {
            message.success('View updated successfully')
            setUpdateModalOpen(false)
            updateForm.resetFields()
            refetch()
          },
          onError: () => {
            message.error('Failed to update view')
          },
        }
      )
    } catch (error) {
      // Validation failed
    }
  }

  const handleDeleteView = (viewId: string) => {
    deleteView(
      {
        resource: 'saved-views',
        id: viewId,
      },
      {
        onSuccess: () => {
          message.success('View deleted successfully')
          if (selectedView === viewId) {
            setSelectedView(null)
            onViewSelect({})
          }
          refetch()
        },
        onError: () => {
          message.error('Failed to delete view')
        },
      }
    )
  }

  const handleSetDefault = (viewId: string) => {
    updateView(
      {
        resource: 'saved-views',
        id: viewId,
        values: { isDefault: true },
      },
      {
        onSuccess: () => {
          message.success('Default view set successfully')
          refetch()
        },
      }
    )
  }

  const openUpdateModal = () => {
    const view = views.find((v) => v.id === selectedView)
    if (view) {
      updateForm.setFieldsValue({
        name: view.name,
        isDefault: view.isDefault,
      })
      setUpdateModalOpen(true)
    }
  }

  return (
    <>
      <Space.Compact style={{ width: 300 }}>
        <Select
          style={{ flex: 1 }}
          placeholder="Select a view"
          value={selectedView}
          onChange={handleViewChange}
          loading={isLoading}
          options={views.map((view) => ({
            label: (
              <Space>
                {view.isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                {view.name}
              </Space>
            ),
            value: view.id,
          }))}
        />
        <Button onClick={() => setSaveModalOpen(true)}>Save</Button>
        {selectedView && (
          <>
            <Button icon={<EditOutlined />} onClick={openUpdateModal} />
            <Popconfirm
              title="Are you sure you want to delete this view?"
              onConfirm={() => handleDeleteView(selectedView)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
            {!views.find((v) => v.id === selectedView)?.isDefault && (
              <Button
                icon={<StarOutlined />}
                onClick={() => handleSetDefault(selectedView)}
                title="Set as default"
              />
            )}
          </>
        )}
      </Space.Compact>

      {/* Save New View Modal */}
      <Modal
        title="Save View As"
        open={saveModalOpen}
        onOk={handleSaveNewView}
        onCancel={() => setSaveModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="View Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., High Value Orders" />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>Set as default view</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update View Modal */}
      <Modal
        title="Update View"
        open={updateModalOpen}
        onOk={handleUpdateView}
        onCancel={() => setUpdateModalOpen(false)}
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item
            name="name"
            label="View Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>Set as default view</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
