import React, { useState, useEffect } from 'react';
import {
  Flag,
  Search,
  Filter,
  Eye,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Loader2,
  Shield,
  Trash2,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { BlogReport, BlogReportStats, BlogPagination } from '../../types';
import { API_BASE_URL } from '../../config';

interface BlogReportManagerProps {
  onNavigate?: (nav: string) => void;
}

const BlogReportManager: React.FC<BlogReportManagerProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<BlogReport[]>([]);
  const [stats, setStats] = useState<BlogReportStats | null>(null);
  const [pagination, setPagination] = useState<BlogPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BlogReport | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [reportToAction, setReportToAction] = useState<BlogReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('none');

  useEffect(() => {
    fetchReports();
  }, [statusFilter, currentPage]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20'
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`${API_BASE_URL}/api/blogs/admin/reports?${params}`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReports(data.reports || []);
          setStats(data.stats || null);
          setPagination(data.pagination || null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewReport = async (status: 'resolved' | 'dismissed') => {
    if (!reportToAction) return;
    
    setActionLoading(reportToAction.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/admin/reports/${reportToAction.id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAction,
          adminNotes: adminNotes,
          status: status
        })
      });

      if (res.ok) {
        setShowActionModal(false);
        setReportToAction(null);
        setAdminNotes('');
        setSelectedAction('none');
        fetchReports();
      }
    } catch (error) {
      console.error('Failed to review report:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" />, text: 'Pending' },
      reviewed: { color: 'bg-blue-100 text-blue-700', icon: <Eye className="w-3 h-3" />, text: 'Reviewed' },
      resolved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" />, text: 'Resolved' },
      dismissed: { color: 'bg-slate-100 text-slate-600', icon: <XCircle className="w-3 h-3" />, text: 'Dismissed' }
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getReasonBadge = (reason: string) => {
    const reasons: Record<string, { color: string; text: string }> = {
      spam: { color: 'bg-orange-100 text-orange-700', text: 'Spam' },
      inappropriate: { color: 'bg-red-100 text-red-700', text: 'Inappropriate' },
      harassment: { color: 'bg-purple-100 text-purple-700', text: 'Harassment' },
      misinformation: { color: 'bg-blue-100 text-blue-700', text: 'Misinformation' },
      other: { color: 'bg-slate-100 text-slate-600', text: 'Other' }
    };

    const r = reasons[reason] || reasons.other;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>
        {r.text}
      </span>
    );
  };

  const getActionBadge = (action: string | undefined) => {
    if (!action || action === 'none') return null;
    
    const actions: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      warning: { color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3 h-3" />, text: 'Warning Sent' },
      hidden: { color: 'bg-orange-100 text-orange-700', icon: <EyeOff className="w-3 h-3" />, text: 'Content Hidden' },
      deleted: { color: 'bg-red-100 text-red-700', icon: <Trash2 className="w-3 h-3" />, text: 'Content Deleted' }
    };

    const a = actions[action];
    if (!a) return null;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${a.color}`}>
        {a.icon}
        {a.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Flag className="w-7 h-7 text-red-600" />
            Blog Reports
          </h1>
          <p className="text-slate-500 mt-1">Review and manage user-reported blog content</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-500">Total Reports</div>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{stats.reviewed}</div>
            <div className="text-sm text-blue-600">Reviewed</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
            <div className="text-sm text-green-600">Resolved</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-2xl font-bold text-slate-700">{stats.dismissed}</div>
            <div className="text-sm text-slate-500">Dismissed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <Flag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No reports found</h3>
            <p className="text-slate-500 mt-1">All clear! No reports match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(report.status)}
                      {getReasonBadge(report.reason)}
                      {getActionBadge(report.actionTaken)}
                    </div>

                    <h3 className="font-semibold text-slate-900 mt-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {report.blogTitle}
                    </h3>

                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Reported by: {report.reporterName}
                      </span>
                      <span>Blog Author: {report.blogAuthorName}</span>
                      <span>{report.createdAt}</span>
                    </div>

                    {report.description && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg">
                        "{report.description}"
                      </p>
                    )}

                    {report.adminNotes && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-700 mb-1">Admin Notes:</p>
                        <p className="text-sm text-blue-600">{report.adminNotes}</p>
                        {report.reviewerName && (
                          <p className="text-xs text-blue-500 mt-1">
                            Reviewed by {report.reviewerName} on {report.reviewedAt}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {report.status === 'pending' && (
                      <button
                        onClick={() => {
                          setReportToAction(report);
                          setShowActionModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <div className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={!pagination.hasNext}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(selectedReport.status)}
                {getReasonBadge(selectedReport.reason)}
                {getActionBadge(selectedReport.actionTaken)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Reported Blog</p>
                  <p className="font-semibold text-slate-900">{selectedReport.blogTitle}</p>
                  <p className="text-sm text-slate-500 mt-1">By {selectedReport.blogAuthorName}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Reporter</p>
                  <p className="font-semibold text-slate-900">{selectedReport.reporterName}</p>
                  <p className="text-sm text-slate-500 mt-1">{selectedReport.createdAt}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-700 mb-2">Report Reason</h4>
                <p className="text-slate-600 bg-red-50 p-4 rounded-xl">
                  <span className="font-medium">{selectedReport.reason}</span>
                  {selectedReport.description && (
                    <>
                      <br />
                      <span className="text-sm mt-2 block">{selectedReport.description}</span>
                    </>
                  )}
                </p>
              </div>

              {selectedReport.adminNotes && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Admin Notes</h4>
                  <p className="text-slate-600 bg-blue-50 p-4 rounded-xl">
                    {selectedReport.adminNotes}
                  </p>
                  {selectedReport.reviewerName && (
                    <p className="text-sm text-slate-500 mt-2">
                      Reviewed by {selectedReport.reviewerName} on {selectedReport.reviewedAt}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              {selectedReport.status === 'pending' && (
                <button
                  onClick={() => {
                    setReportToAction(selectedReport);
                    setShowActionModal(true);
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Take Action
                </button>
              )}
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && reportToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Review Report</h2>
              <p className="text-sm text-slate-500 mt-1">
                Report on: {reportToAction.blogTitle}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Action to take
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                >
                  <option value="none">No action needed</option>
                  <option value="warning">Send warning to author</option>
                  <option value="hidden">Hide the blog post</option>
                  <option value="deleted">Delete the blog post</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setReportToAction(null);
                  setAdminNotes('');
                  setSelectedAction('none');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewReport('dismissed')}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-slate-600 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleReviewReport('resolved')}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Resolve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogReportManager;
