import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Meditation } from '@/api/entities';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateMeditationForm({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    level: 'מתחיל',
    duration: '10 דקות',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Meditation.create({
        ...formData,
        is_custom: true,
      });
      toast.success('התרגיל האישי נוצר בהצלחה!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create meditation:", error);
      toast.error('אירעה שגיאה ביצירת התרגיל.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">יצירת תרגיל אישי חדש</DialogTitle>
          <DialogDescription>
            מלא את הפרטים הבאים כדי ליצור תרגול מדיטציה מותאם אישית.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">שם התרגיל</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="לדוגמה: מדיטציית הכרת הטוב" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">תיאור קצר</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="מה מטרת התרגיל? (משפט או שניים)" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="instructions">הוראות התרגול</Label>
            <Textarea id="instructions" value={formData.instructions} onChange={(e) => handleChange('instructions', e.target.value)} placeholder="הסבר צעד אחר צעד כיצד לבצע את התרגיל." required className="h-24" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="level">רמה</Label>
              <Select value={formData.level} onValueChange={(value) => handleChange('level', value)}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="בחר רמה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="מתחיל">מתחיל</SelectItem>
                  <SelectItem value="בינוני">בינוני</SelectItem>
                  <SelectItem value="מתקדם">מתקדם</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">זמן מומלץ</Label>
              <Input id="duration" value={formData.duration} onChange={(e) => handleChange('duration', e.target.value)} placeholder="לדוגמה: 15 דקות" required />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'שומר...' : 'שמור תרגיל'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}