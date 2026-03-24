import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, AlertCircle, TrendingUp, Clock, ChevronDown, ExternalLink } from 'lucide-react';

interface MajorWork {
  id: string;
  title: string;
  location: string;
  createdOn: string;
  stage: string;
  status: 'In progress' | 'On hold' | 'Completed' | 'Delayed' | 'Cancelled';
}

interface AIChatBubbleProps {
  onOpenProject?: (projectId: string) => void;
}

export default function AIChatBubble({ onOpenProject }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string, timestamp?: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Show initial AI greeting with summary
      setTimeout(() => {
        setMessages([
          {
            type: 'ai',
            content: "GREETING_WITH_URGENT",
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 500);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: userMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    setInputValue('');
    setIsTyping(true);
    setShowSuggestions(false);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Delayed projects
    if (lowerMessage.includes('delay') || lowerMessage.includes('delayed')) {
      return "📊 **Delayed Projects:**\n\n**Cladding Project Dockside** is currently delayed due to:\n• Missing tender submissions (2 contractors)\n• Section 20 consultation period needs extension\n• Estimated delay: 3-4 weeks\n\n**Recommended actions:**\n1. Contact contractors for updated quotes\n2. File extension request for consultation period\n3. Update leaseholders with revised timeline\n\nWould you like me to draft a notification for the leaseholders?";
    }

    // Status updates
    if (lowerMessage.includes('status') || lowerMessage.includes('progress')) {
      return "📈 **Current Status Overview:**\n\n✅ **In Progress (8 projects):**\n• 3 in Notice of Intention stage\n• 2 in Statement of Estimate\n• 2 in Notice of Reasons\n• 1 in Tender stage\n\n⏸️ **On Hold (3 projects):**\n• Awaiting client approval\n• Budget review pending\n\n⏰ **Upcoming Deadlines:**\n• Nov 28: Riverside Roof document approval\n• Dec 5: Legacy House consultation ends\n• Dec 12: Eastside statement review\n\nNeed details on any specific project?";
    }

    // Riverside specific
    if (lowerMessage.includes('riverside')) {
      return "🏢 **Riverside Roof Project:**\n\n**Current Stage:** Notice of Intention\n**Status:** In Progress\n**Urgency:** High - Document approval due in 2 days (Nov 28)\n\n**Quick Stats:**\n• Total Cost: £450,000 (inc. VAT)\n• Leaseholder Contribution: £18,750 each (inc. VAT)\n• Recipients: 46 leaseholders\n• Documents: 8 ready to send, 3 pending review\n\n**Action Required:**\n• Review and approve 3 pending documents\n• Send notice to leaseholders before deadline\n\nWould you like to see the pending documents?";
    }

    // Budget or cost
    if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      return "💰 **Budget Overview:**\n\n**Total Portfolio:** £1.2M (inc. VAT) across 29 projects\n\n**Top 5 Projects by Cost:**\n1. Riverside Roof - £450,000 (inc. VAT)\n2. Cladding Dockside - £385,000 (inc. VAT)\n3. Legacy House RSF - £280,000 (inc. VAT)\n4. Eastside Cladding - £195,000 (inc. VAT)\n5. Car Lift Refurb - £65,000 (Completed, inc. VAT)\n\n**Budget Status:**\n• 92% within approved estimates\n• 2 projects pending budget review\n• £340K in completed works this year\n\nNeed a detailed cost breakdown for any project?";
    }

    // Documents
    if (lowerMessage.includes('document') || lowerMessage.includes('notice')) {
      return "📄 **Document Status:**\n\n**Ready to Send (15 documents):**\n• 8 for Riverside Roof\n• 4 for Legacy House\n• 3 for Dockside Project\n\n**Pending Review (7 documents):**\n• 3 Notice of Intention drafts\n• 2 Statement of Estimates\n• 2 Tender documents\n\n**Recent Activity:**\n• 5 documents sent today\n• 12 awaiting leaseholder responses\n• 3 documents with AI-flagged issues\n\n⚠️ **AI Detected Issues:**\n• Date inconsistencies (2 docs)\n• Missing contractor details (1 doc)\n\nShould I show you the flagged documents?";
    }

    // Urgent or deadline
    if (lowerMessage.includes('urgent') || lowerMessage.includes('deadline') || lowerMessage.includes('attention')) {
      return "URGENT_ITEMS_LIST";
    }

    // Leaseholders
    if (lowerMessage.includes('leaseholder') || lowerMessage.includes('consultation')) {
      return "👥 **Leaseholder Consultation Status:**\n\n**Active Consultations:**\n• Riverside Roof: 46 leaseholders (0 responses yet)\n• Legacy House: 32 leaseholders (8 responses, 3 objections)\n• Dockside: 28 leaseholders (consultation paused)\n\n**Response Rates:**\n• Average: 35% response rate\n• Objections: 12% of responses\n• Common concerns: Cost allocation, timeline\n\n**Pending Actions:**\n• 2 consultation periods need extension\n• 5 leaseholder queries unanswered\n• 1 formal objection requires response\n\nNeed help drafting responses to objections?";
    }

    // Section 20
    if (lowerMessage.includes('section 20') || lowerMessage.includes('compliance')) {
      return "⚖️ **Section 20 Compliance:**\n\n**Compliant Projects (6):**\n• All stages properly documented\n• Consultation periods met\n• Required notices sent\n\n**Attention Required (2):**\n• Dockside - Missing 3rd contractor quote\n• Eastside - Consultation extension needed\n\n**Recent Compliance Checks:**\n✅ All notices include required information\n✅ Proper consultation periods observed\n⚠️ 2 documents need date format corrections\n\n**Recommendation:**\nAddress Dockside contractor quotes within 5 days to maintain compliance.\n\nWould you like a detailed compliance report?";
    }

    // Help or general
    if (lowerMessage.includes('help') || lowerMessage.includes('can you') || lowerMessage.includes('how')) {
      return "💡 **I can help you with:**\n\n📊 **Project Information:**\n• Status updates and progress\n• Detailed project summaries\n• Stage-specific information\n\n📄 **Documents & Notices:**\n• Document status and reviews\n• AI-flagged issues and suggestions\n• Compliance checks\n\n💰 **Budget & Costs:**\n• Cost breakdowns\n• Budget status\n• Financial summaries\n\n🚨 **Alerts & Deadlines:**\n• Urgent items\n• Upcoming deadlines\n• Action recommendations\n\n👥 **Leaseholder Management:**\n• Consultation status\n• Response tracking\n• Query management\n\nTry asking: \"What's urgent?\", \"Show me delayed projects\", or \"Riverside status\"";
    }

    // Default response
    return "I understand you're asking about: \"" + userMessage + "\"\n\nI can help with:\n• Project status and progress updates\n• Urgent items and deadlines\n• Document reviews and compliance\n• Budget and cost information\n• Leaseholder consultations\n\nCould you please be more specific? For example:\n• \"What projects are delayed?\"\n• \"Show me urgent items\"\n• \"Riverside Roof status\"\n• \"What's my budget overview?\"";
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: suggestion,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    setIsTyping(true);
    setShowSuggestions(false);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(suggestion);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const suggestions = [
    "What needs urgent attention?",
    "Show me delayed projects",
    "Riverside Roof status",
    "Budget overview"
  ];

  // Render special greeting message with clickable links
  const renderGreetingMessage = (onProjectClick: (id: string) => void) => {
    return (
      <div>
        <div>👋 Hi! I'm Aidenn, your Major Works AI Assistant. Here's what needs your attention:</div>
        
        <div className="mt-3">
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>🔴 <strong>Urgent (2 items)</strong></div>
          
          {/* Clickable urgent items */}
          <button
            className="btn btn-sm btn-outline-danger w-100 text-start mb-2"
            style={{
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#212529'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onProjectClick('4');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
              e.currentTarget.style.color = '#212529';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#212529';
            }}
          >
            <span>• Cladding Project Dockside<br /><span className="text-muted" style={{ fontSize: '11px' }}>Delayed, missing tender submissions</span></span>
            <ExternalLink size={14} />
          </button>
          
          <button
            className="btn btn-sm btn-outline-danger w-100 text-start mb-2"
            style={{
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#212529'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onProjectClick('1');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
              e.currentTarget.style.color = '#212529';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#212529';
            }}
          >
            <span>• Riverside Roof<br /><span className="text-muted" style={{ fontSize: '11px' }}>Document approval deadline in 2 days</span></span>
            <ExternalLink size={14} />
          </button>
        </div>
        
        <div className="mt-3">
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>🟡 <strong>Upcoming (3 items)</strong></div>
          
          {/* Clickable upcoming items */}
          <button
            className="btn btn-sm btn-outline-warning w-100 text-start mb-2"
            style={{
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#212529'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onProjectClick('3');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
              e.currentTarget.style.color = '#212529';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#212529';
            }}
          >
            <span>• RSF Project Legacy House<br /><span className="text-muted" style={{ fontSize: '11px' }}>Consultation period ending soon</span></span>
            <ExternalLink size={14} />
          </button>
          
          <button
            className="btn btn-sm btn-outline-secondary w-100 text-start mb-2"
            style={{
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#212529'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onProjectClick('2');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(108, 117, 125, 0.1)';
              e.currentTarget.style.color = '#212529';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#212529';
            }}
          >
            <span>• Developer Cladding Eastside<br /><span className="text-muted" style={{ fontSize: '11px' }}>Statement of estimate reviews pending</span></span>
            <ExternalLink size={14} />
          </button>
          
          <button
            className="btn btn-sm btn-outline-secondary w-100 text-start mb-2"
            style={{
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#212529'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onProjectClick('7');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(108, 117, 125, 0.1)';
              e.currentTarget.style.color = '#212529';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#212529';
            }}
          >
            <span>• Developer Cladding Eastside (On Hold)<br /><span className="text-muted" style={{ fontSize: '11px' }}>Status update required</span></span>
            <ExternalLink size={14} />
          </button>
        </div>
        
        <div className="mt-3" style={{ fontSize: '14px' }}>
          How can I help you today?
        </div>
      </div>
    );
  };

  // Render urgent items response with clickable links
  const renderUrgentItemsMessage = (onProjectClick: (id: string) => void) => {
    return (
      <div>
        <div style={{ fontWeight: 600, marginBottom: '12px' }}>🚨 <strong>Urgent Items Requiring Attention:</strong></div>
        
        <div style={{ fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>**Critical (Next 48 hours):**</div>
        
        <button
          className="btn btn-sm btn-outline-danger w-100 text-start mb-2"
          style={{
            fontSize: '13px',
            padding: '8px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#212529'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onProjectClick('1');
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
            e.currentTarget.style.color = '#212529';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#212529';
          }}
        >
          <span>1. Riverside Roof<br /><span className="text-muted" style={{ fontSize: '11px' }}>Approve & send documents (Due: Nov 28)</span></span>
          <ExternalLink size={14} />
        </button>
        
        <button
          className="btn btn-sm btn-outline-warning w-100 text-start mb-3"
          style={{
            fontSize: '13px',
            padding: '8px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#212529'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onProjectClick('3');
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
            e.currentTarget.style.color = '#212529';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#212529';
          }}
        >
          <span>2. Legacy House<br /><span className="text-muted" style={{ fontSize: '11px' }}>Respond to leaseholder queries (Due: Nov 27)</span></span>
          <ExternalLink size={14} />
        </button>
        
        <div style={{ fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>**High Priority (This Week):**</div>
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          3. Dockside Tender - Submit missing contractor quotes<br />
          4. Eastside Statement - Complete budget review<br />
          5. 3 consultation periods ending Dec 5-8
        </div>
        
        <div style={{ marginTop: '12px', fontSize: '13px', lineHeight: '1.6' }}>
          <strong>**Recommendations:**</strong><br />
          • Prioritize Riverside Roof approval today<br />
          • Schedule contractor follow-ups for Dockside<br />
          • Prepare consultation extension requests
        </div>
        
        <div style={{ marginTop: '12px', fontSize: '14px' }}>
          Would you like me to create a priority action plan?
        </div>
      </div>
    );
  };

  const handleProjectClick = (projectId: string) => {
    if (onOpenProject) {
      setIsOpen(false);
      onOpenProject(projectId);
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <div
        className="position-fixed"
        style={{
          bottom: '24px',
          right: '24px',
          zIndex: 1045
        }}
      >
        {!isOpen && (
          <div className="position-relative">
            {/* Notification Badge */}
            <div
              className="position-absolute bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '2px solid white',
                zIndex: 1
              }}
            >
              2
            </div>
            
            <button
              className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center position-relative"
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#7c3aed',
                borderColor: '#7c3aed'
              }}
              onClick={() => setIsOpen(true)}
            >
              <Sparkles size={28} />
              
              {/* Pulse animation */}
              <span
                className="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
                style={{
                  backgroundColor: '#7c3aed',
                  opacity: 0.4,
                  animation: 'pulse 2s infinite'
                }}
              />
            </button>
          </div>
        )}

        {/* Chat Panel */}
        {isOpen && (
          <div
            className="bg-white rounded-3 shadow-lg"
            style={{
              width: '420px',
              height: '600px',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header */}
            <div
              className="p-3 d-flex align-items-center justify-content-between"
              style={{
                backgroundColor: '#7c3aed',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                color: 'white'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <Sparkles size={24} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>
                    Aidenn
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    Major Works Assistant
                  </div>
                </div>
              </div>
              <button
                className="btn btn-link text-white p-0"
                onClick={() => setIsOpen(false)}
                style={{ opacity: 0.9 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div
              className="flex-grow-1 p-3 overflow-auto"
              style={{
                backgroundColor: '#f8f9fa',
                maxHeight: '100%'
              }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-3 d-flex ${message.type === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className="rounded-3 p-3"
                    style={{
                      maxWidth: '85%',
                      backgroundColor: message.type === 'user' ? '#0d6efd' : 'white',
                      color: message.type === 'user' ? 'white' : '#333',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      whiteSpace: message.content === 'GREETING_WITH_URGENT' || message.content === '🚨 **Urgent Items Requiring Attention:**' ? 'normal' : 'pre-line',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      border: message.type === 'ai' ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                  >
                    {message.content === 'GREETING_WITH_URGENT' ? (
                      renderGreetingMessage(handleProjectClick)
                    ) : message.content === 'URGENT_ITEMS_LIST' ? (
                      renderUrgentItemsMessage(handleProjectClick)
                    ) : (
                      message.content
                    )}
                    {message.timestamp && (
                      <div
                        className="mt-2"
                        style={{
                          fontSize: '11px',
                          opacity: 0.7
                        }}
                      >
                        {message.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="mb-3 d-flex justify-content-start">
                  <div
                    className="rounded-3 p-3 bg-white"
                    style={{
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div className="d-flex gap-1">
                      <div
                        className="rounded-circle bg-secondary"
                        style={{
                          width: '8px',
                          height: '8px',
                          animation: 'bounce 1.4s infinite ease-in-out both',
                          animationDelay: '-0.32s'
                        }}
                      />
                      <div
                        className="rounded-circle bg-secondary"
                        style={{
                          width: '8px',
                          height: '8px',
                          animation: 'bounce 1.4s infinite ease-in-out both',
                          animationDelay: '-0.16s'
                        }}
                      />
                      <div
                        className="rounded-circle bg-secondary"
                        style={{
                          width: '8px',
                          height: '8px',
                          animation: 'bounce 1.4s infinite ease-in-out both'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (shown initially) */}
            {showSuggestions && messages.length > 0 && (
              <div className="px-3 pb-2" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="text-muted small mb-2">
                  Quick questions:
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="btn btn-sm btn-outline-primary"
                      style={{
                        fontSize: '12px',
                        borderRadius: '16px',
                        padding: '4px 12px'
                      }}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-top">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ask me anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  style={{
                    borderRadius: '20px 0 0 20px',
                    fontSize: '14px'
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  style={{
                    borderRadius: '0 20px 20px 0',
                    backgroundColor: '#7c3aed',
                    borderColor: '#7c3aed'
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}