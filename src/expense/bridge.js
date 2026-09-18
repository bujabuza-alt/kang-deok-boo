// ──────────────────────────────────────────────────────────────────────────────
// expense/bridge.js
// 다른 기능(예: 위시리스트)이 지출 데이터를 직접 다뤄야 할 때 쓰는 진입점.
// et_ 로 시작하는 localStorage 키 이름을 아는 곳을 이 파일 하나로 제한해,
// 다른 모듈이 그 이름을 하드코딩해 직접 읽고 쓰지 않도록 합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { DEFAULT_PAYMENT_METHODS } from './constants';
import { ls, uid, TODAY } from './utils';

export function addQuickExpense({ name, amount, date = TODAY, memo = '' }) {
  const expenses = ls.get('et_expenses', []);
  const paymentMethods = ls.get('et_payment_methods', DEFAULT_PAYMENT_METHODS);
  ls.set('et_expenses', [
    ...expenses,
    {
      id: uid(),
      date,
      name,
      amount,
      paymentMethod: paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
      memo,
    },
  ]);
}
