import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Image, Calendar, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackSubmission {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  screenshotPath?: string;
}

const FeedbackView = () => {
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { toast } = useToast();

  const feedbackTypes = ['Bug', 'Glitch', 'UI Issue', 'Feature Request', 'Other'];

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedback(data);
      setFilteredFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    let filtered = feedback;

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredFeedback(filtered);
  }, [feedback, typeFilter, dateFilter]);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Bug':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Glitch':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'UI Issue':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Feature Request':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Other':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading feedback...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <MessageSquare className="h-6 w-6 mr-2" />
                Feedback Submissions
              </CardTitle>
              <CardDescription>
                Review and manage user feedback submissions
              </CardDescription>
            </div>
            <Button onClick={fetchFeedback} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {feedbackTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setTypeFilter('');
                  setDateFilter('');
                }}
                variant="outline"
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{filteredFeedback.length}</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredFeedback.filter(f => f.type === 'Bug').length}
                </div>
                <div className="text-sm text-gray-600">Bugs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredFeedback.filter(f => f.type === 'Feature Request').length}
                </div>
                <div className="text-sm text-gray-600">Feature Requests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredFeedback.filter(f => f.screenshotPath).length}
                </div>
                <div className="text-sm text-gray-600">With Screenshots</div>
              </div>
            </div>
          </div>

          {/* Feedback List */}
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-600">
                {feedback.length === 0 
                  ? "No feedback submissions yet." 
                  : "No feedback matches the current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={getBadgeColor(item.type)}>
                          {item.type}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(item.timestamp), 'PPp')}
                        </div>
                      </div>
                      {item.screenshotPath && (
                        <Badge variant="outline" className="flex items-center">
                          <Image className="h-3 w-3 mr-1" />
                          Screenshot
                        </Badge>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{item.message}</p>
                    </div>

                    {item.screenshotPath && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-2">Screenshot:</p>
                        <img
                          src={`/api/feedback/screenshots/${item.screenshotPath?.split('/').pop()}`}
                          alt="Feedback screenshot"
                          className="max-w-full h-auto rounded border shadow-sm max-h-96 object-contain"
                          crossOrigin="use-credentials"
                          onLoad={() => console.log('Screenshot loaded successfully')}
                          onError={(e) => {
                            console.error('Screenshot failed to load:', e);
                            const target = e.target as HTMLImageElement;
                            console.log('Failed URL:', target.src);
                            target.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'text-red-600 text-sm';
                            errorDiv.textContent = 'Screenshot not found';
                            target.parentNode?.appendChild(errorDiv);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackView;