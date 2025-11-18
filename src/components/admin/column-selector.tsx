'use client'

import React, { useState } from 'react'
import { Popover, Checkbox, Button, Space, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MenuOutlined } from '@ant-design/icons'

const { Text } = Typography

export interface ColumnConfig {
  key: string
  title: string
  visible: boolean
  fixed?: boolean // Some columns like ID or Actions should not be hidden
}

interface ColumnSelectorProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
}

interface SortableItemProps {
  column: ColumnConfig
  onVisibilityChange: (key: string, visible: boolean) => void
}

const SortableItem: React.FC<SortableItemProps> = ({ column, onVisibilityChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.key,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: '8px 0',
    cursor: 'move',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Space>
        <div {...attributes} {...listeners}>
          <MenuOutlined style={{ cursor: 'grab' }} />
        </div>
        <Checkbox
          checked={column.visible}
          disabled={column.fixed}
          onChange={(e) => onVisibilityChange(column.key, e.target.checked)}
        >
          <Text>{column.title}</Text>
        </Checkbox>
      </Space>
    </div>
  )
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onColumnsChange }) => {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [open, setOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((item) => item.key === active.id)
        const newIndex = items.findIndex((item) => item.key === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleVisibilityChange = (key: string, visible: boolean) => {
    setLocalColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible } : col))
    )
  }

  const handleApply = () => {
    onColumnsChange(localColumns)
    setOpen(false)
  }

  const handleReset = () => {
    const resetColumns = columns.map((col) => ({ ...col, visible: true }))
    setLocalColumns(resetColumns)
    onColumnsChange(resetColumns)
  }

  const handleShowAll = () => {
    const allVisible = localColumns.map((col) => ({ ...col, visible: true }))
    setLocalColumns(allVisible)
  }

  const handleHideAll = () => {
    const allHidden = localColumns.map((col) =>
      col.fixed ? col : { ...col, visible: false }
    )
    setLocalColumns(allHidden)
  }

  const content = (
    <div style={{ width: 300 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button size="small" onClick={handleShowAll}>
            Show All
          </Button>
          <Button size="small" onClick={handleHideAll}>
            Hide All
          </Button>
        </Space>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localColumns.map((c) => c.key)} strategy={verticalListSortingStrategy}>
            {localColumns.map((column) => (
              <SortableItem
                key={column.key}
                column={column}
                onVisibilityChange={handleVisibilityChange}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={handleReset}>
            Reset
          </Button>
          <Button type="primary" size="small" onClick={handleApply}>
            Apply
          </Button>
        </Space>
      </Space>
    </div>
  )

  return (
    <Popover
      content={content}
      title="Customize Columns"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Button icon={<SettingOutlined />}>
        Columns
      </Button>
    </Popover>
  )
}
