import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

export default function ChatInterface({ schedule, level, onComplete, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!conversationStarted) {
      startConversation();
      setConversationStarted(true);
    }
  }, [conversationStarted]);

  const getInitialPrompt = () => {
    if (level === 1) {
      return `אתה 'חברותא' (שותף ללימוד) תומך וסקרן. המשתמש סיים ללמוד את הנושא "${schedule.title}" מהספר "${schedule.sourceBookTitle}".

תפקידך לנהל איתו שיחה חמה ותומכת שעוזרת לו להעמיק במה שלמד. הנחיות חשובות:
- התחל בברכה חמה ובקש ממנו לספר לך בקצרה מה למד
- אל תציף אותו בשאלות - שאל שאלה אחת בכל פעם
- חכה לתשובה שלו לפני שתמשיך לשאלה הבאה
- הקפד להגיב לתוכן שלו לפני שתשאל שאלה חדשה
- שאל שאלות הבהרה ובקש ממנו להרחיב על נקודות מעניינות
- השתמש רק במה שהוא מספר לך - אל תוסיף ידע חיצוני
- עודד אותו ותן לו הרגשה שהוא לומד טוב

התחל בברכה חמה ובבקשה פשוטה לסיכום.`;
    } else {
      return `אתה 'חברותא' (שותף ללימוד) תלמיד חכם ותומך. המשתמש סיים ללמד את הנושא "${schedule.title}" מהספר "${schedule.sourceBookTitle}".

תפקידך לנהל איתו שיחה מעמיקה ומשכילה. הנחיות חשובות:
- התחל בברכה חמה וציין שאתה מכיר את החומר שלמד
- בקש ממנו לספר לך מה למד, אבל אל תציף בשאלות
- שאל שאלה אחת בכל פעם וחכה לתשובתו
- השתמש בידע שלך על החומר כדי לשאול שאלות מעמיקות
- חבר בין מה שהוא אומר לרעיונות נוספים באותו ספר או פרק
- שאל איך ניתן ליישם את הלימוד בחיי היומיום
- עודד אותו ותן לו הרגשה שהוא מתקדם

התחל בברכה חמה ובציון שאתה מכיר את החומר.`;
    }
  };

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const initialPrompt = getInitialPrompt();
      const response = await InvokeLLM({
        prompt: initialPrompt + "\n\nכתב ברכה קצרה וחמה והתחל את השיחה."
      });
      
      setMessages([{
        role: 'bot',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([{
        role: 'bot',
        content: 'שלום! אני כאן לעזור לך לעבד את מה שלמדת. בואו נתחיל - איך היה הלימוד?',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation context
      const conversationHistory = messages
        .map(msg => `${msg.role === 'user' ? 'משתמש' : 'חברותא'}: ${msg.content}`)
        .join('\n');

      const fullPrompt = `${getInitialPrompt()}

היסטוריית השיחה עד כה:
${conversationHistory}
משתמש: ${inputMessage}

עכשיו תגיב כ'חברותא'. זכור:
- תגיב קודם למה שהמשתמש אמר עכשיו
- שאל שאלה אחת בלבד
- היה תומך ומעודד
- אל תכתוב רשימות או נקודות - כתב כמו בשיחה רגילה
- תשאל שאלה שעוזרת לו להעמיק או להבין טוב יותר`;

      const response = await InvokeLLM({
        prompt: fullPrompt
      });

      setMessages(prev => [...prev, {
        role: 'bot',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'bot', 
        content: 'מצטער, יש בעיה טכנית. בואו ננסה שוב.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const finishSession = () => {
    const transcript = messages
      .map(msg => `${msg.role === 'user' ? 'משתמש' : 'חברותא'}: ${msg.content}`)
      .join('\n');
    
    const userSummary = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');

    onComplete(userSummary, transcript);
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'bot' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <Card className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
              <CardContent className="p-3">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </CardContent>
            </Card>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <Card className="bg-white">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">החברותא חושב...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="כתב את תשובתך או שאלתך..."
            className="flex-1 min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onCancel}>ביטול</Button>
          <Button onClick={finishSession} disabled={messages.length < 2}>סיים שיחה</Button>
        </div>
      </div>
    </div>
  );
}