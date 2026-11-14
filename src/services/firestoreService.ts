import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';
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
  RecurringSchedule,
  Budget,
  BudgetStatus,
} from '../types';

export const FirestoreService = {
  /**
   * Inicializa as coleções básicas caso o banco de dados esteja vazio no primeiro acesso por um administrador.
   */
  async seedInitialDataIfEmpty(initialData: {
    profiles: Profile[];
    ministries: Ministry[];
    goals: Goal[];
    schedules: Schedule[];
    announcements: Announcement[];
    budgets: Budget[];
    expenses: MinistryExpense[];
    cashTransactions: CashTransaction[];
    events: ChurchEvent[];
  }): Promise<boolean> {
    try {
      const profilesRef = collection(db, 'profiles');
      const snap = await getDocs(query(profilesRef, limit(1)));
      if (!snap.empty) {
        return false;
      }

      console.log('[FirestoreService] Banco vazio detectado. Semeando dados com lote seguro...');
      const batch = writeBatch(db);

      for (const p of initialData.profiles) {
        batch.set(doc(db, 'profiles', p.id), cleanForFirestore(p));
      }
      for (const m of initialData.ministries) {
        batch.set(doc(db, 'ministries', m.id), cleanForFirestore(m));
      }
      for (const g of initialData.goals) {
        batch.set(doc(db, 'goals', g.id), cleanForFirestore(g));
      }
      for (const s of initialData.schedules) {
        batch.set(doc(db, 'schedules', s.id), cleanForFirestore(s));
      }
      for (const a of initialData.announcements) {
        batch.set(doc(db, 'announcements', a.id), cleanForFirestore(a));
      }
      for (const b of initialData.budgets) {
        batch.set(doc(db, 'budgets', b.id), cleanForFirestore(b));
      }
      for (const e of initialData.expenses) {
        batch.set(doc(db, 'ministry_expenses', e.id), cleanForFirestore(e));
      }
      for (const c of initialData.cashTransactions) {
        batch.set(doc(db, 'cash_transactions', c.id), cleanForFirestore(c));
      }
      for (const ev of initialData.events) {
        batch.set(doc(db, 'church_events', ev.id), cleanForFirestore(ev));
      }

      await batch.commit();
      console.log('[FirestoreService] Semeamento inicial concluído com sucesso.');
      return true;
    } catch (err) {
      console.error('[FirestoreService] Falha estruturada no semeamento inicial:', err);
      return false;
    }
  },

  // ========================================================
  // PERFIS (PROFILES) - Bounded queries (PERF-01) & Sem Mock Fallback (OBS-01)
  // ========================================================
  async getProfiles(maxResults = 100): Promise<Profile[]> {
    try {
      const q = query(collection(db, 'profiles'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Profile));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar perfis:', err);
      throw err;
    }
  },

  async saveProfile(profile: Profile): Promise<void> {
    try {
      await setDoc(doc(db, 'profiles', profile.id), cleanForFirestore(profile), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao gravar perfil:', err);
      throw err;
    }
  },

  async deleteProfile(profileId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'profiles', profileId));
    } catch (err) {
      console.error('[FirestoreService] Falha ao excluir perfil:', err);
      throw err;
    }
  },

  // ========================================================
  // MINISTÉRIOS (MINISTRIES)
  // ========================================================
  async getMinistries(maxResults = 50): Promise<Ministry[]> {
    try {
      const q = query(collection(db, 'ministries'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Ministry));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar ministérios:', err);
      throw err;
    }
  },

  async saveMinistry(ministry: Ministry): Promise<void> {
    try {
      await setDoc(doc(db, 'ministries', ministry.id), cleanForFirestore(ministry), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar ministério:', err);
      throw err;
    }
  },

  async deleteMinistry(ministryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'ministries', ministryId));
    } catch (err) {
      console.error('[FirestoreService] Falha ao excluir ministério:', err);
      throw err;
    }
  },

  async deleteAllMinistries(): Promise<void> {
    try {
      const snap = await getDocs(query(collection(db, 'ministries'), limit(100)));
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      console.log('[FirestoreService] Ministérios removidos com sucesso.');
    } catch (err) {
      console.error('[FirestoreService] Falha ao apagar todos os ministérios:', err);
      throw err;
    }
  },

  // ========================================================
  // CONFIGURAÇÕES DO SISTEMA (APP SETTINGS & FEATURE TOGGLES)
  // ========================================================
  async getAppSettings(): Promise<Record<string, boolean> | null> {
    try {
      const ref = doc(db, 'app_settings', 'features');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as Record<string, boolean>;
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreService] Falha ao buscar configurações de recursos:', err);
      return null;
    }
  },

  async saveAppSettings(features: Record<string, boolean>): Promise<void> {
    try {
      await setDoc(doc(db, 'app_settings', 'features'), cleanForFirestore(features), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Falha ao salvar configurações de recursos:', err);
      throw err;
    }
  },

  // ========================================================
  // ESCALAS (SCHEDULES)
  // ========================================================
  async getSchedules(maxResults = 50): Promise<Schedule[]> {
    try {
      const q = query(collection(db, 'schedules'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Schedule));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar escalas:', err);
      throw err;
    }
  },

  async saveSchedule(schedule: Schedule): Promise<void> {
    try {
      await setDoc(doc(db, 'schedules', schedule.id), cleanForFirestore(schedule), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar escala:', err);
      throw err;
    }
  },

  // ========================================================
  // METAS E RELATÓRIOS (GOALS & REPORTS)
  // ========================================================
  async getGoals(maxResults = 50): Promise<Goal[]> {
    try {
      const q = query(collection(db, 'goals'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Goal));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar metas:', err);
      throw err;
    }
  },

  async saveGoal(goal: Goal): Promise<void> {
    try {
      await setDoc(doc(db, 'goals', goal.id), cleanForFirestore(goal), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar meta:', err);
      throw err;
    }
  },

  async saveReport(report: Report): Promise<void> {
    try {
      await setDoc(doc(db, 'reports', report.id), cleanForFirestore(report), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar relatório:', err);
      throw err;
    }
  },

  // ========================================================
  // DESPESAS & ORÇAMENTOS (EXPENSES & BUDGETS)
  // ========================================================
  async getExpenses(maxResults = 50): Promise<MinistryExpense[]> {
    try {
      const q = query(collection(db, 'ministry_expenses'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as MinistryExpense));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar despesas:', err);
      throw err;
    }
  },

  async saveExpense(expense: MinistryExpense): Promise<void> {
    try {
      await setDoc(doc(db, 'ministry_expenses', expense.id), cleanForFirestore(expense), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar despesa:', err);
      throw err;
    }
  },

  async updateExpenseStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      await updateDoc(doc(db, 'ministry_expenses', id), { status });
    } catch (err) {
      console.error('[FirestoreService] Erro ao atualizar status de despesa:', err);
      throw err;
    }
  },

  async getBudgets(maxResults = 50): Promise<Budget[]> {
    try {
      const q = query(collection(db, 'budgets'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Budget));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar orçamentos:', err);
      throw err;
    }
  },

  async updateBudgetStatus(id: string, status: BudgetStatus | string, notes?: string): Promise<void> {
    try {
      const updateData: Record<string, any> = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      if (notes) {
        updateData.pastoral_notes = notes;
      }
      await updateDoc(doc(db, 'budgets', id), updateData);
    } catch (err) {
      console.error('[FirestoreService] Erro ao atualizar status de orçamento:', err);
      throw err;
    }
  },

  /**
   * TRANSAÇÃO ATÔMICA REAL (REL-02):
   * Executa a aprovação do orçamento e a geração do lançamento de saída no livro-caixa
   * em uma única transação atômica do Cloud Firestore (runTransaction).
   * Se o lançamento financeiro falhar, o status do orçamento NÃO é alterado.
   */
  async approveBudgetAndRegisterCashTransaction(
    budgetId: string,
    maadNotes: string,
    cashTransaction: CashTransaction
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const budgetRef = doc(db, 'budgets', budgetId);
        const budgetDoc = await transaction.get(budgetRef);

        if (!budgetDoc.exists()) {
          throw new Error(`Orçamento com ID "${budgetId}" não foi encontrado no banco de dados.`);
        }

        const cashTxRef = doc(db, 'cash_transactions', cashTransaction.id);

        // 1. Atualiza status do orçamento para aprovado
        transaction.update(budgetRef, {
          status: 'aprovado_maad',
          maad_notes: maadNotes,
          updated_at: new Date().toISOString(),
        });

        // 2. Cria o lançamento contábil de saída
        transaction.set(cashTxRef, cleanForFirestore(cashTransaction));
      });
      console.log(`[FirestoreService] Transação atômica concluída com sucesso para o orçamento ${budgetId}`);
    } catch (err) {
      console.error('[FirestoreService] Falha na transação atômica de aprovação contábil:', err);
      throw err;
    }
  },

  /**
   * Rejeita o orçamento via MAAD com registro estruturado de notas contábeis.
   */
  async rejectBudgetTransaction(budgetId: string, maadNotes: string): Promise<void> {
    try {
      const budgetRef = doc(db, 'budgets', budgetId);
      await updateDoc(budgetRef, {
        status: 'rejeitado_maad',
        maad_notes: maadNotes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[FirestoreService] Falha ao rejeitar orçamento no MAAD:', err);
      throw err;
    }
  },

  // ========================================================
  // TESOURARIA / CAIXA (CASH TRANSACTIONS)
  // ========================================================
  async getCashTransactions(maxResults = 50): Promise<CashTransaction[]> {
    try {
      const q = query(collection(db, 'cash_transactions'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as CashTransaction));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar movimentações financeiras:', err);
      throw err;
    }
  },

  async saveCashTransaction(transaction: CashTransaction): Promise<void> {
    try {
      await setDoc(doc(db, 'cash_transactions', transaction.id), cleanForFirestore(transaction), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar transação financeira:', err);
      throw err;
    }
  },

  // ========================================================
  // COMUNICADOS (ANNOUNCEMENTS)
  // ========================================================
  async getAnnouncements(maxResults = 50): Promise<Announcement[]> {
    try {
      const q = query(collection(db, 'announcements'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar comunicados:', err);
      throw err;
    }
  },

  async saveAnnouncement(announcement: Announcement): Promise<void> {
    try {
      await setDoc(doc(db, 'announcements', announcement.id), cleanForFirestore(announcement), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar comunicado:', err);
      throw err;
    }
  },

  // ========================================================
  // EVENTOS (CHURCH EVENTS)
  // ========================================================
  async getEvents(maxResults = 50): Promise<ChurchEvent[]> {
    try {
      const q = query(collection(db, 'church_events'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as ChurchEvent));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar eventos:', err);
      throw err;
    }
  },

  async saveEvent(event: ChurchEvent): Promise<void> {
    try {
      await setDoc(doc(db, 'church_events', event.id), cleanForFirestore(event), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar evento:', err);
      throw err;
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'church_events', eventId));
    } catch (err) {
      console.error('[FirestoreService] Falha ao excluir evento:', err);
      throw err;
    }
  },

  // ========================================================
  // CULTOS FIXOS RECORRENTES (RECURRING SCHEDULES)
  // ========================================================
  async getRecurringSchedules(maxResults = 50): Promise<RecurringSchedule[]> {
    try {
      const q = query(collection(db, 'recurring_schedules'), limit(maxResults));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as RecurringSchedule));
    } catch (err) {
      console.error('[FirestoreService] Erro ao buscar cultos fixos recorrentes:', err);
      throw err;
    }
  },

  async saveRecurringSchedule(schedule: RecurringSchedule): Promise<void> {
    try {
      await setDoc(doc(db, 'recurring_schedules', schedule.id), cleanForFirestore(schedule), { merge: true });
    } catch (err) {
      console.error('[FirestoreService] Erro ao salvar culto fixo:', err);
      throw err;
    }
  },

  async deleteRecurringSchedule(scheduleId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'recurring_schedules', scheduleId));
    } catch (err) {
      console.error('[FirestoreService] Falha ao excluir culto fixo:', err);
      throw err;
    }
  },
};
