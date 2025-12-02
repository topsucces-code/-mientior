"use client";

import React, { useState } from "react";
import { 
  Card, 
  Space, 
  Typography, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Tag, 
  Select, 
  message,
  List,
  Avatar,
  Popconfirm,
  Row,
  Col,
  Divider
} from "antd";
import { 
  FileTextOutlined,
  TagOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { useCreate, useDelete, useUpdate, useList } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CustomerNote {
  id: string;
  content: string;
  createdBy: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CustomerTag {
  id: string;
  name: string;
  color: string;
  assignedAt: string;
}

interface CustomerSegment {
  id: string;
  name: string;
  criteria: any;
  isAutomatic: boolean;
  assignedAt: string;
}

interface AvailableTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface NotesAndTagsSectionProps {
  customerId: string;
  tags: CustomerTag[];
  segments: CustomerSegment[];
}

export function NotesAndTagsSection({ customerId, tags, segments }: NotesAndTagsSectionProps) {
  const { t } = useTranslation(["common", "admin"]);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);
  const [form] = Form.useForm();
  const [tagForm] = Form.useForm();

  // Fetch customer notes
  const { data: notesData, refetch: refetchNotes } = useList<CustomerNote>({
    resource: `admin/customers/${customerId}/notes`,
    pagination: { pageSize: 10 },
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  // Fetch available tags
  const { data: availableTagsData } = useList<AvailableTag>({
    resource: "admin/tags",
    pagination: { pageSize: 100 },
  });

  const notes = notesData?.data || [];
  const availableTags = availableTagsData?.data || [];

  // Mutations
  const { mutate: createNote } = useCreate();
  const { mutate: updateNote } = useUpdate();
  const { mutate: deleteNote } = useDelete();
  const { mutate: assignTag } = useCreate();
  const { mutate: removeTag } = useDelete();

  const handleSaveNote = () => {
    form.validateFields().then((values) => {
      if (editingNote) {
        // Update existing note
        updateNote({
          resource: `admin/customers/${customerId}/notes`,
          id: editingNote.id,
          values: { content: values.content },
          successNotification: {
            message: t("admin:customers.360.notes.updated"),
            type: "success",
          },
        }, {
          onSuccess: () => {
            setNoteModalVisible(false);
            setEditingNote(null);
            form.resetFields();
            refetchNotes();
          }
        });
      } else {
        // Create new note
        createNote({
          resource: `admin/customers/${customerId}/notes`,
          values: { content: values.content },
          successNotification: {
            message: t("admin:customers.360.notes.created"),
            type: "success",
          },
        }, {
          onSuccess: () => {
            setNoteModalVisible(false);
            form.resetFields();
            refetchNotes();
          }
        });
      }
    });
  };

  const handleEditNote = (note: CustomerNote) => {
    setEditingNote(note);
    form.setFieldsValue({ content: note.content });
    setNoteModalVisible(true);
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote({
      resource: `admin/customers/${customerId}/notes`,
      id: noteId,
      successNotification: {
        message: t("admin:customers.360.notes.deleted"),
        type: "success",
      },
    }, {
      onSuccess: () => {
        refetchNotes();
      }
    });
  };

  const handleAssignTags = () => {
    tagForm.validateFields().then((values) => {
      const newTagIds = values.tags.filter((tagId: string) => 
        !tags.some(tag => tag.id === tagId)
      );

      if (newTagIds.length === 0) {
        message.info(t("admin:customers.360.tags.noNewTags"));
        return;
      }

      // Assign each new tag
      Promise.all(
        newTagIds.map((tagId: string) =>
          new Promise((resolve, reject) => {
            assignTag({
              resource: `admin/customers/${customerId}/tags`,
              values: { tagId },
            }, {
              onSuccess: resolve,
              onError: reject
            });
          })
        )
      ).then(() => {
        message.success(t("admin:customers.360.tags.assigned"));
        setTagModalVisible(false);
        tagForm.resetFields();
        // Refresh the parent component to get updated tags
        window.location.reload();
      }).catch(() => {
        message.error(t("admin:customers.360.tags.assignError"));
      });
    });
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag({
      resource: `admin/customers/${customerId}/tags`,
      id: tagId,
      successNotification: {
        message: t("admin:customers.360.tags.removed"),
        type: "success",
      },
    }, {
      onSuccess: () => {
        // Refresh the parent component to get updated tags
        window.location.reload();
      }
    });
  };

  const openNoteModal = () => {
    setEditingNote(null);
    form.resetFields();
    setNoteModalVisible(true);
  };

  const openTagModal = () => {
    tagForm.setFieldsValue({ 
      tags: tags.map(tag => tag.id) 
    });
    setTagModalVisible(true);
  };

  return (
    <>
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            {t("admin:customers.360.notesAndTags.title")}
          </Space>
        }
        style={{ height: "100%" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* Customer Tags */}
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong style={{ fontSize: "13px" }}>
                  <TagOutlined /> {t("admin:customers.360.tags.title")}
                </Text>
              </Col>
              <Col>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={openTagModal}
                >
                  {t("common.edit")}
                </Button>
              </Col>
            </Row>
            
            <Space wrap>
              {tags.map((tag) => (
                <Tag
                  key={tag.id}
                  color={tag.color}
                  closable
                  onClose={() => handleRemoveTag(tag.id)}
                  style={{ fontSize: "11px" }}
                >
                  {tag.name}
                </Tag>
              ))}
              {tags.length === 0 && (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.tags.noTags")}
                </Text>
              )}
            </Space>
          </Space>

          {/* Customer Segments */}
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Text strong style={{ fontSize: "13px" }}>
              <TeamOutlined /> {t("admin:customers.360.segments.title")}
            </Text>
            
            <Space wrap>
              {segments.map((segment) => (
                <Tag
                  key={segment.id}
                  color={segment.isAutomatic ? "blue" : "green"}
                  style={{ fontSize: "11px" }}
                >
                  {segment.name}
                  {segment.isAutomatic && (
                    <Text style={{ fontSize: "10px", marginLeft: 4 }}>
                      ({t("admin:customers.360.segments.auto")})
                    </Text>
                  )}
                </Tag>
              ))}
              {segments.length === 0 && (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.segments.noSegments")}
                </Text>
              )}
            </Space>
          </Space>

          <Divider style={{ margin: "12px 0" }} />

          {/* Customer Notes */}
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong style={{ fontSize: "13px" }}>
                  <FileTextOutlined /> {t("admin:customers.360.notes.title")}
                </Text>
              </Col>
              <Col>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={openNoteModal}
                >
                  {t("admin:customers.360.notes.add")}
                </Button>
              </Col>
            </Row>

            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {notes.length === 0 ? (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {t("admin:customers.360.notes.noNotes")}
                </Text>
              ) : (
                <List
                  dataSource={notes}
                  renderItem={(note) => (
                    <List.Item
                      key={note.id}
                      actions={[
                        <Button
                          key="edit"
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditNote(note)}
                        />,
                        <Popconfirm
                          key="delete"
                          title={t("admin:customers.360.notes.deleteConfirm")}
                          onConfirm={() => handleDeleteNote(note.id)}
                          okText={t("common.yes")}
                          cancelText={t("common.no")}
                        >
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      ]}
                      style={{ padding: "8px 0" }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={note.author.avatar}
                            icon={<UserOutlined />}
                            size="small"
                          />
                        }
                        title={
                          <Space>
                            <Text strong style={{ fontSize: "12px" }}>
                              {note.author.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "11px" }}>
                              {dayjs(note.createdAt).format("MMM D, YYYY HH:mm")}
                            </Text>
                          </Space>
                        }
                        description={
                          <Paragraph
                            style={{ 
                              fontSize: "12px", 
                              margin: 0,
                              whiteSpace: "pre-wrap"
                            }}
                            ellipsis={{ rows: 3, expandable: true }}
                          >
                            {note.content}
                          </Paragraph>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Space>
        </Space>
      </Card>

      {/* Note Modal */}
      <Modal
        title={
          editingNote 
            ? t("admin:customers.360.notes.edit")
            : t("admin:customers.360.notes.add")
        }
        open={noteModalVisible}
        onOk={handleSaveNote}
        onCancel={() => {
          setNoteModalVisible(false);
          setEditingNote(null);
          form.resetFields();
        }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("admin:customers.360.notes.content")}
            name="content"
            rules={[
              { required: true, message: t("admin:customers.360.notes.contentRequired") },
              { min: 10, message: t("admin:customers.360.notes.contentMinLength") }
            ]}
          >
            <TextArea
              rows={6}
              placeholder={t("admin:customers.360.notes.contentPlaceholder")}
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Tag Assignment Modal */}
      <Modal
        title={t("admin:customers.360.tags.manage")}
        open={tagModalVisible}
        onOk={handleAssignTags}
        onCancel={() => {
          setTagModalVisible(false);
          tagForm.resetFields();
        }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Form form={tagForm} layout="vertical">
          <Form.Item
            label={t("admin:customers.360.tags.selectTags")}
            name="tags"
            rules={[{ required: false }]}
          >
            <Select
              mode="multiple"
              placeholder={t("admin:customers.360.tags.selectTagsPlaceholder")}
              style={{ width: "100%" }}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={availableTags.map(tag => ({
                value: tag.id,
                label: tag.name,
                color: tag.color
              }))}
              tagRender={(props) => {
                const tag = availableTags.find(t => t.id === props.value);
                return (
                  <Tag
                    color={tag?.color}
                    closable={props.closable}
                    onClose={props.onClose}
                    style={{ marginRight: 3 }}
                  >
                    {props.label}
                  </Tag>
                );
              }}
            />
          </Form.Item>
          
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {t("admin:customers.360.tags.manageHint")}
          </Text>
        </Form>
      </Modal>
    </>
  );
}