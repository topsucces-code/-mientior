"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Input,
  message,
  Tabs,
  Badge,
  Card,
  Form,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  MessageOutlined,
} from "@ant-design/icons";

interface ProductQuestion {
  id: string;
  productId: string;
  productName: string;
  userId?: string;
  userName?: string;
  question: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  helpful: number;
  notHelpful: number;
  verified: boolean;
  createdAt: string;
  answers: ProductAnswer[];
}

interface ProductAnswer {
  id: string;
  questionId: string;
  userId?: string;
  vendorId?: string;
  answer: string;
  isOfficial: boolean;
  createdAt: string;
}

interface QAModerationPanelProps {
  productId?: string;
}

export const QAModerationPanel: React.FC<QAModerationPanelProps> = ({
  productId,
}) => {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<ProductQuestion | null>(
    null
  );
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [answerModalVisible, setAnswerModalVisible] = useState(false);
  const [answerForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );

  useEffect(() => {
    fetchQuestions();
  }, [productId, activeTab]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const url = productId
        ? `/api/admin/qa/questions?productId=${productId}&status=${activeTab.toUpperCase()}`
        : `/api/admin/qa/questions?status=${activeTab.toUpperCase()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      message.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/qa/questions/${questionId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        message.success("Question approved");
        fetchQuestions();
      } else {
        throw new Error("Approval failed");
      }
    } catch (error) {
      console.error("Approval error:", error);
      message.error("Failed to approve question");
    }
  };

  const handleReject = async (questionId: string) => {
    Modal.confirm({
      title: "Reject Question",
      content: "Are you sure you want to reject this question?",
      okText: "Reject",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(
            `/api/admin/qa/questions/${questionId}/reject`,
            {
              method: "POST",
            }
          );

          if (response.ok) {
            message.success("Question rejected");
            fetchQuestions();
          } else {
            throw new Error("Rejection failed");
          }
        } catch (error) {
          console.error("Rejection error:", error);
          message.error("Failed to reject question");
        }
      },
    });
  };

  const handleViewDetails = (question: ProductQuestion) => {
    setSelectedQuestion(question);
    setDetailModalVisible(true);
  };

  const handleAddAnswer = (question: ProductQuestion) => {
    setSelectedQuestion(question);
    answerForm.resetFields();
    setAnswerModalVisible(true);
  };

  const handleSubmitAnswer = async () => {
    try {
      const values = await answerForm.validateFields();

      if (!selectedQuestion) return;

      const response = await fetch(
        `/api/products/${selectedQuestion.productId}/questions/${selectedQuestion.id}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: values.answer,
            isOfficial: true,
          }),
        }
      );

      if (response.ok) {
        message.success("Official response added");
        setAnswerModalVisible(false);
        answerForm.resetFields();
        fetchQuestions();
      } else {
        throw new Error("Failed to add answer");
      }
    } catch (error) {
      console.error("Answer submission error:", error);
      message.error("Failed to add official response");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "orange",
      APPROVED: "green",
      REJECTED: "red",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      width: 200,
    },
    {
      title: "Question",
      dataIndex: "question",
      key: "question",
      ellipsis: true,
      render: (text: string) => (
        <div className="max-w-md truncate">{text}</div>
      ),
    },
    {
      title: "Asked By",
      dataIndex: "userName",
      key: "userName",
      width: 120,
      render: (name: string) => name || "Anonymous",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Answers",
      key: "answers",
      width: 80,
      render: (_: unknown, record: ProductQuestion) => (
        <Badge count={record.answers.length} showZero />
      ),
    },
    {
      title: "Helpful",
      dataIndex: "helpful",
      key: "helpful",
      width: 80,
      render: (helpful: number, record: ProductQuestion) => (
        <span>
          {helpful} / {record.notHelpful}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: unknown, record: ProductQuestion) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === "PENDING" && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === "APPROVED" && (
            <Button
              size="small"
              icon={<MessageOutlined />}
              onClick={() => handleAddAnswer(record)}
            >
              Answer
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = questions.filter((q) => q.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
          items={[
            {
              key: "pending",
              label: (
                <span>
                  Pending{" "}
                  {pendingCount > 0 && (
                    <Badge count={pendingCount} offset={[10, 0]} />
                  )}
                </span>
              ),
            },
            {
              key: "approved",
              label: "Approved",
            },
            {
              key: "rejected",
              label: "Rejected",
            },
          ]}
        />

        <Table
          dataSource={questions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} questions`,
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModalVisible}
        title="Question Details"
        footer={null}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Product</h4>
              <p>{selectedQuestion.productName}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Question</h4>
              <p className="text-gray-700">{selectedQuestion.question}</p>
            </div>

            <div className="flex gap-4">
              <div>
                <h4 className="font-medium mb-2">Asked By</h4>
                <p>{selectedQuestion.userName || "Anonymous"}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Tag color={getStatusColor(selectedQuestion.status)}>
                  {selectedQuestion.status}
                </Tag>
              </div>
              <div>
                <h4 className="font-medium mb-2">Date</h4>
                <p>{new Date(selectedQuestion.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Helpfulness</h4>
              <p>
                {selectedQuestion.helpful} helpful, {selectedQuestion.notHelpful}{" "}
                not helpful
              </p>
            </div>

            {selectedQuestion.answers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Answers</h4>
                <div className="space-y-3">
                  {selectedQuestion.answers.map((answer) => (
                    <Card key={answer.id} size="small">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-700">{answer.answer}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(answer.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {answer.isOfficial && (
                          <Tag color="blue">Official Response</Tag>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {selectedQuestion.status === "PENDING" && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleApprove(selectedQuestion.id);
                    setDetailModalVisible(false);
                  }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    handleReject(selectedQuestion.id);
                    setDetailModalVisible(false);
                  }}
                >
                  Reject
                </Button>
              </div>
            )}

            {selectedQuestion.status === "APPROVED" && (
              <div className="pt-4 border-t">
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    handleAddAnswer(selectedQuestion);
                  }}
                >
                  Add Official Response
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Answer Modal */}
      <Modal
        open={answerModalVisible}
        title="Add Official Response"
        onOk={handleSubmitAnswer}
        onCancel={() => {
          setAnswerModalVisible(false);
          answerForm.resetFields();
        }}
        okText="Submit Response"
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Question</h4>
              <p className="text-gray-700">{selectedQuestion.question}</p>
            </div>

            <Form form={answerForm} layout="vertical">
              <Form.Item
                name="answer"
                label="Official Response"
                rules={[
                  { required: true, message: "Please enter a response" },
                  { min: 10, message: "Response must be at least 10 characters" },
                ]}
              >
                <Input.TextArea
                  rows={6}
                  placeholder="Enter your official response to this question..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};
