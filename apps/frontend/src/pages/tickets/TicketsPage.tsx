import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { ticketsApi } from '../../services/api';
import { CreateTicketForm } from './CreateTicketForm';

export function TicketsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', currentPage, statusFilter, priorityFilter, categoryFilter, searchQuery],
    queryFn: () => ticketsApi.list({
      page: currentPage,
      limit: 20,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      category: categoryFilter || undefined,
      q: searchQuery || undefined
    })
  });

  const handleCreateTicket = () => {
    setShowCreateModal(false);
    refetch();
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      LOW: 'default',
      MEDIUM: 'info',
      HIGH: 'warning',
      URGENT: 'danger'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'default'} size="sm">
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
      <Badge variant={variants[status as keyof typeof variants] || 'default'} size="sm">
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

  const tickets = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customer support requests and issues
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Kanban
            </button>
          </div>
          <Button
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            New Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tickets by subject or customer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-32">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="ESCALATED">Escalated</option>
            </Select>
          </div>
          <div className="sm:w-32">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
          <div className="sm:w-32">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="TECHNICAL">Technical</option>
              <option value="BILLING">Billing</option>
              <option value="COMPLAINT">Complaint</option>
              <option value="REQUEST">Request</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <Button variant="outline">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Ticket List */}
      {viewMode === 'list' ? (
        <Card>
          {tickets.length === 0 ? (
            <EmptyState
              icon={<ExclamationTriangleIcon className="h-12 w-12" />}
              title="No tickets found"
              description="No support tickets match your current filters."
              action={
                <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                  Create Ticket
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Subject</TableCell>
                    <TableCell header>Customer</TableCell>
                    <TableCell header>Category</TableCell>
                    <TableCell header>Priority</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Assigned</TableCell>
                    <TableCell header>Created</TableCell>
                    <TableCell header>SLA</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: any) => (
                    <TableRow 
                      key={ticket.id}
                      clickable
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {ticket.subject}
                          </div>
                          {ticket.subscription && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {ticket.subscription.plan?.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.customer ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ticket.customer.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {ticket.customer.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Internal</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(ticket.category)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(ticket.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell>
                        {ticket.assignedUser ? (
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {ticket.assignedUser.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.slaDueAt && (
                          <div className={`text-sm ${
                            new Date(ticket.slaDueAt) < new Date()
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {new Date(ticket.slaDueAt).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'].map((status) => {
            const statusTickets = tickets.filter((ticket: any) => ticket.status === status);
            return (
              <Card key={status} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {status.replace('_', ' ')}
                  </h3>
                  <Badge variant="default" size="sm">
                    {statusTickets.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {statusTickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                        {ticket.subject}
                      </div>
                      <div className="flex items-center justify-between">
                        {getPriorityBadge(ticket.priority)}
                        {getCategoryBadge(ticket.category)}
                      </div>
                      {ticket.customer && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {ticket.customer.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Support Ticket"
        size="lg"
      >
        <CreateTicketForm
          onSuccess={handleCreateTicket}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}