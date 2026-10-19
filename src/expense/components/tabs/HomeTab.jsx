'use client';
import BudgetCard   from '@/expense/components/BudgetCard';
import CalendarView from '@/expense/components/CalendarView';
import DailyPanel   from '@/expense/components/DailyPanel';

export default function HomeTab({
  summary, carryEnabled, onToggleCarry,
  editingBudget, budgetDraft,
  onEditBudgetStart, onBudgetDraftChange, onSaveBudget, onCancelBudgetEdit,
  year, month, calDays, dayTotals, selDate, today,
  onPrev, onNext, onSelectDate,
  selExpenses, onOpenAddModal, onDeleteExpense, onEditExpense,
}) {
  return (
    <div className="space-y-4">
      <BudgetCard
        summary={summary}
        carryEnabled={carryEnabled}
        onToggleCarry={onToggleCarry}
        editingBudget={editingBudget}
        budgetDraft={budgetDraft}
        onEditStart={onEditBudgetStart}
        onDraftChange={onBudgetDraftChange}
        onSave={onSaveBudget}
        onCancel={onCancelBudgetEdit}
      />

      <CalendarView
        year={year} month={month}
        calDays={calDays} dayTotals={dayTotals}
        selDate={selDate} today={today}
        onPrev={onPrev} onNext={onNext}
        onSelectDate={onSelectDate}
      />

      {selDate && (
        <DailyPanel
          selDate={selDate}
          selExpenses={selExpenses}
          onAddExpense={onOpenAddModal}
          onDeleteExpense={onDeleteExpense}
          onEditExpense={onEditExpense}
        />
      )}
    </div>
  );
}
