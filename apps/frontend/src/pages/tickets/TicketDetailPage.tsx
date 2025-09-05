import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  PaperClipIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FormField, Label, Textarea, Select } from '../../components/ui/Form';
import { ticketsApi } from '../../services/api';
import toast from 'react-hot-toast';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getById(id!),
    enabled: !!id
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: string; body: string }) =>
      ticketsApi.addReply(ticketId, { body }),
    onSuccess: () => {
      toast.success('Reply added successfully');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      ticketsApi.updateStatus(ticketId, status),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const handleReply = () => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ ticketId: id!, body: replyText });
  };

  const handleStatusChange = () => {
    if (!newStatus) return;
    statusMutation.mutate({ ticketId: id!, status: newStatus });
    setNewStatus('');
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      LOW: 'default',
      MEDIUM: 'info',
      HIGH: 'warning',
      URGENT: 'danger'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'default'}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      OPEN: 'warning',
      IN_PROGRESS: 'info',
      RESOLVED: 'success',
      CLOSED: 'default',
      ESCALATED: 'danger'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      TECHNICAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      BILLING: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      COMPLAINT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      REQUEST: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[category as keyof typeof colors] || colors.OTHER
      }`}>
        {category}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket not found</h2>
        <Button className="mt-4" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => navigate('/tickets')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {ticket.subject}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ticket #{ticket.id.substring(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
          {getCategoryBadge(ticket.category)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Messages */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Conversation</h3>
            <div className="space-y-4">
              {ticket.messages?.map((message: any, index: number) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.authorType === 'STAFF' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3xl p-4 rounded-lg ${
                      message.authorType === 'STAFF'
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {message.authorType === 'STAFF' ? message.author?.name : 'Customer'}
                        </span>
                        {message.authorType === 'STAFF' && (
                          <Badge variant="info" size="sm">
                            {message.author?.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {new Date(message.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.body}</div>
                    {message.attachmentsJson && JSON.parse(message.attachmentsJson).length > 0 && (
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <PaperClipIcon className="h-3 w-3 mr-1" />
                        {JSON.parse(message.attachmentsJson).length} attachment(s)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reply Form */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Reply</h3>
            <div className="space-y-4">
              <FormField>
                <Label htmlFor="reply">Message</Label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                />
              </FormField>
              <div className="flex justify-end">
                <Button
                  onClick={handleReply}
                  loading={replyMutation.isPending}
                  disabled={!replyText.trim()}
                  icon={<PaperAirplaneIcon className="h-4 w-4" />}
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Details */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ticket Details</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <div className="mt-1">{getStatusBadge(ticket.status)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Priority</span>
                <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
                <div className="mt-1">{getCategoryBadge(ticket.category)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              {ticket.slaDueAt && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">SLA Due</span>
                  <p className={`text-sm ${
                    new Date(ticket.slaDueAt) < new Date()
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {new Date(ticket.slaDueAt).toLocaleString()}
                  </p>
                </div>
              )}
              {ticket.resolvedAt && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Resolved</span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(ticket.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Customer Info */}
          {ticket.customer && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ticket.customer.name}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {ticket.customer.phone}
                  </p>
                </div>
                {ticket.customer.email && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {ticket.customer.email}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Service Info */}
          {ticket.subscription && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Service</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Plan</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ticket.subscription.plan?.name}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    {ticket.subscription.username || 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="space-y-4">
              <FormField>
                <Label htmlFor="status">Change Status</Label>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ESCALATED">Escalated</option>
                </Select>
              </FormField>
              <Button
                onClick={handleStatusChange}
                loading={statusMutation.isPending}
                disabled={!newStatus}
                className="w-full"
                variant="outline"
              >
                Update Status
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}