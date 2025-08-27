
import React, { useState } from 'react';
import { User } from '@/api/entities';
import { reminderWebhook } from '@/api/functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReminderForm() {
  const [formData, setFormData] = useState({
    reminderDate: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reminderDate || !formData.message.trim()) {
      toast.error('יש למלא את כל השדות');
      return;
    }

    // בדיקה שהתאריך הוא בעתיד
    const selectedDate = new Date(formData.reminderDate);
    const now = new Date();
    if (selectedDate <= now) {
      toast.error('תאריך התזכורת חייב להיות בעתיד');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // המר את התאריך המקומי ל-UTC סטנדרטי (עם Z) בצד הלקוח
      const reminderDateUTC = new Date(formData.reminderDate).toISOString();

      // שלח את התאריך בפורמט UTC לפונקציה
      const { data, status } = await reminderWebhook({
        reminderDate: reminderDateUTC,
        message: formData.message
      });
      
      if (status === 200 && data.success) {
        setSubmitStatus('success');
        toast.success('התזכורת נוצרה בהצלחה ונשלחה ל-AlertSync!');
        
        // איפוס הטופס לאחר הצלחה
        setFormData({ reminderDate: '', message: '' });
      } else {
        // Handle cases where the function returns a non-200 status but doesn't throw
        setSubmitStatus('error');
        const errorMessage = data?.error || 'אירעה שגיאה לא צפויה';
        toast.error(`שגיאה ביצירת התזכורת: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error submitting reminder:', error);
      setSubmitStatus('error');
      // נציג הודעת שגיאה מפורטת יותר אם קיימת
      const detailedError = error.response?.data?.error || 'אירעה שגיאת שרת. אנא נסה שוב מאוחר יותר.';
      toast.error(`שגיאה בשליחת התזכורת: ${detailedError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // פורמט מינימלי לתאריך ושעה (datetime-local input)
  const getMinDateTime = () => {
    const now = new Date();
    // הוסף 5 דקות למועד הנוכחי כמינימום
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  };

  return (
    <div className="max-w-md mx-auto p-4" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            הגדרת תזכורת אישית
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="reminderDate" className="text-base font-medium">
                תאריך ושעת התזכורת
              </Label>
              <Input
                id="reminderDate"
                type="datetime-local"
                value={formData.reminderDate}
                onChange={(e) => handleInputChange('reminderDate', e.target.value)}
                min={getMinDateTime()}
                className="mt-2"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                בחר מתי תרצה לקבל את התזכורת
              </p>
            </div>

            <div>
              <Label htmlFor="message" className="text-base font-medium">
                הודעת התזכורת
              </Label>
              <Textarea
                id="message"
                placeholder="כתוב כאן את הודעת התזכורת שלך..."
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className="mt-2 resize-none"
                maxLength={500}
                required
              />
              <div className="flex justify-between mt-1">
                <p className="text-sm text-gray-500">
                  לדוגמה: "זמן לתפילת מנחה" או "לקרוא פרק בספר"
                </p>
                <span className="text-xs text-gray-400">
                  {formData.message.length}/500
                </span>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.reminderDate || !formData.message.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  שולח תזכורת...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 ml-2" />
                  צור תזכורת
                </>
              )}
            </Button>

            {/* הודעות סטטוס */}
            {submitStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>התזכורת נוצרה בהצלחה ונשלחה ל-AlertSync!</span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-100 text-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>שגיאה ביצירת התזכורת. נסה שוב.</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
