'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Input, List, Avatar, Tag, Space, Typography, Empty } from 'antd'
import {
  SearchOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useGo } from '@refinedev/core'
import { useDebounce } from '@/hooks/use-debounce'

const { Text } = Typography

interface SearchResult {
  id: string
  type: 'products' | 'orders' | 'users' | 'categories'
  title: string
  subtitle?: string
  avatar?: string
  tag?: string
  url: string
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

const TYPE_ICONS = {
  products: <ShoppingOutlined />,
  orders: <ShoppingCartOutlined />,
  users: <UserOutlined />,
  categories: <FolderOutlined />,
}

const TYPE_COLORS = {
  products: 'blue',
  orders: 'green',
  users: 'purple',
  categories: 'orange',
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
  const { t } = useTranslation(['common', 'admin'])
  const go = useGo()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(debouncedSearch)}`)
        const data = await response.json()

        if (data.success) {
          setResults(data.results || [])
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedSearch])

  const handleResultClick = (result: SearchResult) => {
    go({ to: result.url })
    onClose()
    setSearchQuery('')
    setResults([])
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type]!.push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!open) {
          // Would need to be triggered from parent
        }
      }
      // ESC to close
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <Modal
      title={
        <Space>
          <SearchOutlined />
          {t('admin.search.global')}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
    >
      <Input
        size="large"
        placeholder={t('admin.search.placeholder')}
        prefix={<SearchOutlined />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
        style={{ marginBottom: 16 }}
      />

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <Text type="secondary">{t('admin.search.minChars')}</Text>
      )}

      {results.length === 0 && debouncedSearch.length >= 2 && !loading && (
        <Empty description={t('admin.search.noResults')} />
      )}

      {Object.entries(groupedResults).map(([type, typeResults]) => (
        <div key={type} style={{ marginBottom: 24 }}>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>
            {t(`admin.search.types.${type}`)} ({typeResults.length})
          </Text>
          <List
            dataSource={typeResults}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => handleResultClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleResultClick(item)
                  }
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={item.avatar}
                      icon={TYPE_ICONS[item.type]}
                      style={{ backgroundColor: TYPE_COLORS[item.type] }}
                    />
                  }
                  title={
                    <Space>
                      {item.title}
                      {item.tag && (
                        <Tag color={TYPE_COLORS[item.type]}>{item.tag}</Tag>
                      )}
                    </Space>
                  }
                  description={item.subtitle}
                />
              </List.Item>
            )}
          />
        </div>
      ))}

      {loading && <div style={{ textAlign: 'center', padding: 24 }}>{t('common.loading')}</div>}
    </Modal>
  )
}

// Hook to use global search
export const useGlobalSearch = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    open,
    openSearch: () => setOpen(true),
    closeSearch: () => setOpen(false),
  }
}
