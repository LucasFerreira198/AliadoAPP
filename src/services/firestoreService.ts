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
  INITIAL_RECURRING_SCHEDULES,
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
        batch.set(doc(db, 'profiles', p.id), cleanForFirestore(p));
      }

      // 2. Ministérios
      for (const m of INITIAL_MINISTRIES) {
        batch.set(doc(db, 'ministries', m.id), cleanForFirestore(m));
      }

      // 3. Metas
      for (const g of INITIAL_GOALS) {
        batch.set(doc(db, 'goals', g.id), cleanForFirestore(g));
      }

      // 4. Escalas
      for (const s of INITIAL_SCHEDULES) {
        batch.set(doc(db, 'schedules', s.id), cleanForFirestore(s));
      }

      // 5. Comunicados
      for (const a of INITIAL_ANNOUNCEMENTS) {
        batch.set(doc(db, 'announcements', a.id), cleanForFirestore(a));
      }

      // 6. Orçamentos MAAD
      for (const b of INITIAL_BUDGETS) {
        batch.set(doc(db, 'budgets', b.id), cleanForFirestore(b));
      }

      // 7. Despesas
      for (const e of INITIAL_EXPENSES) {
        batch.set(doc(db, 'ministry_expenses', e.id), cleanForFirestore(e));
      }

      // 8. Transações de Caixa
      for (const c of INITIAL_CASH_TRANSACTIONS) {
        batch.set(doc(db, 'cash_transactions', c.id), cleanForFirestore(c));
      }

      // 9. Eventos
      for (const ev of INITIAL_EVENTS) {
        batch.set(doc(db, 'church_events', ev.id), cleanForFirestore(ev));
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
    await setDoc(doc(db, 'profiles', profile.id), cleanForFirestore(profile), { merge: true });

    // Se houver qualquer outro documento no Firestore com o mesmo e-mail (ex: criado pelo Google com UID diferente),
    // atualiza-o também para garantir consistência total de cargo em todas as sessões!
    if (profile.email) {
      try {
        const cleanEmail = profile.email.toLowerCase().trim();
        const q = query(collection(db, 'profiles'), where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          if (docSnap.id !== profile.id) {
            await setDoc(docSnap.ref, cleanForFirestore({ ...docSnap.data(), ...profile, id: docSnap.id }), { merge: true });
          }
        }
      } catch (err) {
        console.warn('[Firestore] Aviso ao sincronizar perfil em documentos com mesmo e-mail:', err);
      }
    }
  },

  async deleteProfile(profileId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'profiles', profileId));
    } catch (err) {
      console.warn('[Firestore] Falha ao excluir perfil:', err);
      throw err;
    }
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

  async saveMinistry(ministry: Ministry): Promise<void> {
    await setDoc(doc(db, 'ministries', ministry.id), cleanForFirestore(ministry), { merge: true });
  },

  async deleteMinistry(ministryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'ministries', ministryId));
    } catch (err) {
      console.warn('[Firestore] Falha ao excluir ministério:', err);
      throw err;
    }
  },

  async deleteAllMinistries(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'ministries'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      console.log('[Firestore] Todos os ministérios foram removidos com sucesso.');
    } catch (err) {
      console.warn('[Firestore] Falha ao apagar todos os ministérios:', err);
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
      console.warn('[Firestore] Falha ao buscar configurações de recursos:', err);
      return null;
    }
  },

  async saveAppSettings(features: Record<string, boolean>): Promise<void> {
    try {
      await setDoc(doc(db, 'app_settings', 'features'), cleanForFirestore(features), { merge: true });
    } catch (err) {
      console.warn('[Firestore] Falha ao salvar configurações de recursos:', err);
      throw err;
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
    await setDoc(doc(db, 'schedules', schedule.id), cleanForFirestore(schedule), { merge: true });
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
    await setDoc(doc(db, 'goals', goal.id), cleanForFirestore(goal), { merge: true });
  },

  async saveReport(report: Report): Promise<void> {
    await setDoc(doc(db, 'reports', report.id), cleanForFirestore(report), { merge: true });
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
    await setDoc(doc(db, 'ministry_expenses', expense.id), cleanForFirestore(expense), { merge: true });
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
    await setDoc(doc(db, 'cash_transactions', transaction.id), cleanForFirestore(transaction), { merge: true });
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
    await setDoc(doc(db, 'announcements', announcement.id), cleanForFirestore(announcement), { merge: true });
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
    await setDoc(doc(db, 'church_events', event.id), cleanForFirestore(event), { merge: true });
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'church_events', eventId));
    } catch (err) {
      console.warn('[Firestore] Falha ao excluir evento:', err);
    }
  },

  // ========================================================
  // CULTOS FIXOS RECORRENTES (RECURRING SCHEDULES)
  // ========================================================
  async getRecurringSchedules(): Promise<RecurringSchedule[]> {
    try {
      const snap = await getDocs(collection(db, 'recurring_schedules'));
      if (snap.empty) return INITIAL_RECURRING_SCHEDULES;
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as RecurringSchedule));
    } catch (err) {
      console.warn('[Firestore] Falha ao buscar cultos fixos recorrentes:', err);
      return INITIAL_RECURRING_SCHEDULES;
    }
  },

  async saveRecurringSchedule(schedule: RecurringSchedule): Promise<void> {
    await setDoc(doc(db, 'recurring_schedules', schedule.id), cleanForFirestore(schedule), { merge: true });
  },

  async deleteRecurringSchedule(scheduleId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'recurring_schedules', scheduleId));
    } catch (err) {
      console.warn('[Firestore] Falha ao excluir culto fixo:', err);
      throw err;
    }
  },
};
