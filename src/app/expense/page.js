'use client';
import { ThemeProvider } from '@/expense/context/ThemeContext';
import ExpenseApp from '@/expense/ExpenseApp';

export default function ExpensePage() {
  return (
    <ThemeProvider>
      <ExpenseApp />
    </ThemeProvider>
  );
}
