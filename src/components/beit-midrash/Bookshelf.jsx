
import React, { useState, useEffect } from 'react';
import { UserLibrary } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Book, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BookCard = ({ book, onDelete, onStatusChange }) => {
    const statusColors = {
        "במהלך לימוד": "bg-blue-100 text-blue-800",
        "בתכנון": "bg-yellow-100 text-yellow-800",
        "הושלם": "bg-green-100 text-green-800"
    };

    return (
      <Card className="bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <CardTitle className="text-lg font-semibold">{book.bookTitle}</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription>
                  פעולה זו תמחק את הספר "{book.bookTitle}" מארון הספרים שלך. לא ניתן לשחזר את הפעולה.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(book.id)} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
             <Select value={book.status} onValueChange={(newStatus) => onStatusChange(book.id, newStatus)}>
                <SelectTrigger className={`w-[150px] text-xs h-8 border-0 focus:ring-0 ${statusColors[book.status]}`}>
                    <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="במהלך לימוד">במהלך לימוד</SelectItem>
                    <SelectItem value="בתכנון">בתכנון</SelectItem>
                    <SelectItem value="הושלם">הושלם</SelectItem>
                </SelectContent>
            </Select>
        </CardContent>
      </Card>
    );
};

export default function Bookshelf({ user, initialBooks, onBooksChange }) {
  const [books, setBooks] = useState(initialBooks || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setBooks(initialBooks || []);
  }, [initialBooks]);

  const handleAddBook = async () => {
    if (!newBookTitle.trim() || !user) return;
    setIsAdding(true);
    try {
      const newBook = await UserLibrary.create({
        userId: user.id,
        bookTitle: newBookTitle,
        status: "בתכנון" // Default status for new books
      });
      setNewBookTitle('');
      setIsDialogOpen(false);
      onBooksChange([...books, newBook]);
      toast.success("הספר נוסף בהצלחה!");
    } catch (error) {
      toast.error("שגיאה בהוספת הספר.");
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      await UserLibrary.delete(bookId);
      onBooksChange(books.filter(b => b.id !== bookId));
      toast.success("הספר נמחק בהצלחה.");
    } catch (error) {
      toast.error("שגיאה במחיקת הספר.");
      console.error(error);
    }
  };

  const handleStatusChange = async (bookId, newStatus) => {
    try {
        await UserLibrary.update(bookId, { status: newStatus });
        const updatedBooks = books.map(book => 
            book.id === bookId ? { ...book, status: newStatus } : book
        );
        onBooksChange(updatedBooks);
        toast.success("סטטוס הספר עודכן!");
    } catch (error) {
        toast.error("שגיאה בעדכון סטטוס.");
        console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold">ארון הספרים שלי</h2>
            <p className="text-gray-500">נהל כאן את ספרי הלימוד האישיים שלך.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              הוסף ספר
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת ספר חדש</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="שם הספר"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
              <Button onClick={handleAddBook} disabled={isAdding || !newBookTitle.trim()}>
                {isAdding && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                שמור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map(book => (
            <BookCard key={book.id} book={book} onDelete={handleDeleteBook} onStatusChange={handleStatusChange} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Book className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="mt-4 text-xl font-semibold text-gray-700">ארון הספרים שלך ריק</h3>
          <p className="mt-1 text-gray-500">התחל על ידי הוספת ספר הלימוד הראשון שלך.</p>
        </div>
      )}
    </div>
  );
}
