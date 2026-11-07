import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Profile,
  Ministry,
  Schedule,
  Goal,
  Report,
  MinistryExpense,
  CashTransaction,
  Announcement,
  ChurchEvent,
  Budget,
  BudgetStatus,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_MINISTRIES,
  INITIAL_GOALS,
  INITIAL_SCHEDULES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BUDGETS,
  INITIAL_EXPENSES,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_EVENTS,
} from './mockData';

export const FirestoreService = {
  /**
   * Inicializa as coleções básicas caso o banco de dados esteja vazio no primeiro acesso.
   */
  async seedInitialDataIfEmpty(): Promise<boolean> {
    try {
      const profilesRef = collection(db, 'profiles');
      const snap = await getDocs(query(profilesRef, limit(1)));
      if (!snap.empty) {
        return false; // Já possui dados semeados
      }

      console.log('[Firestore] Banco vazio detectado. Semeando dados iniciais da igreja...');
      const batch = writeBatch(db);

      // 1. Perfis
      for (const p of INITIAL_PROFILES) {
        batch.set(doc(db, 'profiles', p.id), p);
      }

      // 2. Ministérios
      for (const m of INITIAL_MINISTRIES) {
        batch.set(doc(db, 'ministries', m.id), m);
      }

      // 3. Metas
      for (const g of INITIAL_GOALS) {
        batch.set(doc(db, 'goals', g.id), g);
      }

      // 4. Escalas
      for (const s of INITIAL_SCHEDULES) {
        batch.set(doc(db, 'schedules', s.id), s);
      }

      // 5. Comunicados
      for (const a of INITIAL_ANNOUNCEMENTS) {
        batch.set(doc(db, 'announcements', a.id), a);
      }

      // 6. Orçamentos MAAD
      for (const b of INITIAL_BUDGETS) {
        batch.set(doc(db, 'budgets', b.id), b);
      }

      // 7. Despesas
      for (const e of INITIAL_EXPENSES) {
        batch.set(doc(db, 'ministry_expenses', e.id), e);
      }

      // 8. Transações de Caixa
      for (const c of INITIAL_CASH_TRANSACTIONS) {
        batch.set(doc(db, 'cash_transactions', c.id), c);
      }

      // 9. Eventos
      for (const ev of INITIAL_EVENTS) {
        batch.set(doc(db, 'church_events', ev.id), ev);
      }

      await batch.commit();
      console.log('[Firestore] Semeamento inicial concluído com sucesso.');
      return true;
    } catch (err) {
      console.warn('[Firestore] Erro no semeamento inicial:', err);
      return false;
    }
  },

  // ========================================================
  // PERFIS (PROFILES)
  // ========================================================
  async getProfiles(): Promise<Profile[]> {
    try {
      const snap = await getDocs(collection(db, 'profiles'));
      if (snap.empty) return INITIAL_PROFILES;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Profile));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar perfis:', err);
      return INITIAL_PROFILES;
    }
  },

  async saveProfile(profile: Profile): Promise<void> {
    await setDoc(doc(db, 'profiles', profile.id), profile, { merge: true });
  },

  // ========================================================
  // MINISTÉRIOS (MINISTRIES)
  // ========================================================
  async getMinistries(): Promise<Ministry[]> {
    try {
      const snap = await getDocs(collection(db, 'ministries'));
      if (snap.empty) return INITIAL_MINISTRIES;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Ministry));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar ministérios:', err);
      return INITIAL_MINISTRIES;
    }
  },

  // ========================================================
  // ESCALAS (SCHEDULES)
  // ========================================================
  async getSchedules(): Promise<Schedule[]> {
    try {
      const snap = await getDocs(collection(db, 'schedules'));
      if (snap.empty) return INITIAL_SCHEDULES;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Schedule));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar escalas:', err);
      return INITIAL_SCHEDULES;
    }
  },

  async saveSchedule(schedule: Schedule): Promise<void> {
    await setDoc(doc(db, 'schedules', schedule.id), schedule, { merge: true });
  },

  // ========================================================
  // METAS E RELATÓRIOS (GOALS & REPORTS)
  // ========================================================
  async getGoals(): Promise<Goal[]> {
    try {
      const snap = await getDocs(collection(db, 'goals'));
      if (snap.empty) return INITIAL_GOALS;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Goal));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar metas:', err);
      return INITIAL_GOALS;
    }
  },

  async saveGoal(goal: Goal): Promise<void> {
    await setDoc(doc(db, 'goals', goal.id), goal, { merge: true });
  },

  async saveReport(report: Report): Promise<void> {
    await setDoc(doc(db, 'reports', report.id), report, { merge: true });
  },

  // ========================================================
  // DESPESAS & ORÇAMENTOS (EXPENSES & BUDGETS)
  // ========================================================
  async getExpenses(): Promise<MinistryExpense[]> {
    try {
      const snap = await getDocs(collection(db, 'ministry_expenses'));
      if (snap.empty) return INITIAL_EXPENSES;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as MinistryExpense));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar despesas:', err);
      return INITIAL_EXPENSES;
    }
  },

  async saveExpense(expense: MinistryExpense): Promise<void> {
    await setDoc(doc(db, 'ministry_expenses', expense.id), expense, { merge: true });
  },

  async updateExpenseStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await updateDoc(doc(db, 'ministry_expenses', id), { status });
  },

  async getBudgets(): Promise<Budget[]> {
    try {
      const snap = await getDocs(collection(db, 'budgets'));
      if (snap.empty) return INITIAL_BUDGETS;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Budget));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar orçamentos:', err);
      return INITIAL_BUDGETS;
    }
  },

  async updateBudgetStatus(id: string, status: BudgetStatus | string): Promise<void> {
    await updateDoc(doc(db, 'budgets', id), { status });
  },

  // ========================================================
  // TESOURARIA / CAIXA (CASH TRANSACTIONS)
  // ========================================================
  async getCashTransactions(): Promise<CashTransaction[]> {
    try {
      const snap = await getDocs(collection(db, 'cash_transactions'));
      if (snap.empty) return INITIAL_CASH_TRANSACTIONS;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as CashTransaction));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar movimentações financeiras:', err);
      return INITIAL_CASH_TRANSACTIONS;
    }
  },

  async saveCashTransaction(transaction: CashTransaction): Promise<void> {
    await setDoc(doc(db, 'cash_transactions', transaction.id), transaction, { merge: true });
  },

  // ========================================================
  // COMUNICADOS (ANNOUNCEMENTS)
  // ========================================================
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      if (snap.empty) return INITIAL_ANNOUNCEMENTS;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar comunicados:', err);
      return INITIAL_ANNOUNCEMENTS;
    }
  },

  async saveAnnouncement(announcement: Announcement): Promise<void> {
    await setDoc(doc(db, 'announcements', announcement.id), announcement, { merge: true });
  },

  // ========================================================
  // EVENTOS (CHURCH EVENTS)
  // ========================================================
  async getEvents(): Promise<ChurchEvent[]> {
    try {
      const snap = await getDocs(collection(db, 'church_events'));
      if (snap.empty) return INITIAL_EVENTS;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as ChurchEvent));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar eventos:', err);
      return INITIAL_EVENTS;
    }
  },

  async saveEvent(event: ChurchEvent): Promise<void> {
    await setDoc(doc(db, 'church_events', event.id), event, { merge: true });
  },
};
