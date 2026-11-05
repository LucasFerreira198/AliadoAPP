import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Ban, 
  RotateCcw,
  Sparkles,
  Repeat
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { EventType } from '../src/types';
import { Colors, getThemeColors } from '../src/theme/colors';
import { isValidISODate, formatDateBR } from '../src/utils/formatters';

export default function CalendarScreen() {
  const { 
    currentUser, 
    events, 
    recurringSchedules, 
    createRecurringSchedule, 
    createSpecialEvent, 
    cancelSingleEvent, 
    restoreSingleEvent,
    theme 
  } = useApp();

  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const isSecretariaOrPastor = currentUser?.role === 'secretaria' || currentUser?.role === 'pastor' || currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'agenda' | 'fixos'>('agenda');

  // Formulário de Novo Evento / Culto
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<'fixo' | 'especial'>('fixo');

  // Campos do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0); // 0=Domingo, 2=Terça
  const [dayName, setDayName] = useState('Domingo');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [location, setLocation] = useState('Templo Principal');
  const [eventType, setEventType] = useState<EventType>('culto_fixo');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Dados Incompletos', 'Informe o título do culto ou evento.');
      return;
    }

    if (formMode === 'especial' && !isValidISODate(eventDate.trim())) {
      Alert.alert('Data Inválida', 'A data deve estar no formato AAAA-MM-DD (exemplo: 2026-11-20).');
      return;
    }

    setLoading(true);
    try {
      if (formMode === 'fixo') {
        await createRecurringSchedule({
          title,
          day_of_week: dayOfWeek,
          day_name: dayName,
          start_time: startTime,
          end_time: endTime,
          location,
          description,
        });
        Alert.alert('Culto Fixo Adicionado!', `Acontecerá todo(a) ${dayName} às ${startTime}.`);
      } else {
        await createSpecialEvent({
          title,
          description,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          location,
          event_type: eventType,
        });
        Alert.alert('Evento Agendado!', `Adicionado com sucesso ao calendário oficial da igreja.`);
      }

      setShowModal(false);
      setTitle('');
      setDescription('');
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o evento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = (eventId: string, currentTitle: string) => {
    Alert.prompt
      ? Alert.prompt(
          'Cancelar Esta Data',
          `Informe o motivo do cancelamento de "${currentTitle}":`,
          [
            { text: 'Voltar', style: 'cancel' },
            { 
              text: 'Confirmar Cancelamento', 
              onPress: async (reason) => {
                await cancelSingleEvent(eventId, reason || 'Cancelado pela Secretaria');
              } 
            }
          ]
        )
      : (async () => {
          await cancelSingleEvent(eventId, 'Cancelado excepcionalmente pela Secretaria/Pastor');
          Alert.alert('Culto Cancelado', 'Esta data foi marcada como cancelada no calendário.');
        })();
  };

  const handleRestoreEvent = async (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await restoreSingleEvent(eventId);
    Alert.alert('Reativado', 'O culto foi restabelecido na agenda normal.');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]} 
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <CalendarIcon size={18} color="#DC2626" />
          <Text style={styles.badgeText}>CALENDÁRIO OFICIAL DA IGREJA</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>Cultos & Programação</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Visualização unificada de cultos frequentes, vigílias, conferências e eventos da Igreja Metodista Aliado.
        </Text>
      </View>

      {/* Ações da Secretaria / Pastor */}
      {isSecretariaOrPastor && (
        <View style={styles.secretariaActionRow}>
          <Button
            title="+ Culto Fixo Recorrente"
            onPress={() => {
              setFormMode('fixo');
              setShowModal(true);
            }}
            variant="primary"
            size="sm"
            icon={<Repeat size={14} color="#FFFFFF" />}
            style={{ flex: 1 }}
          />

          <Button
            title="+ Evento / Confraternização"
            onPress={() => {
              setFormMode('especial');
              setShowModal(true);
            }}
            variant="secondary"
            size="sm"
            icon={<Sparkles size={14} color="#FFFFFF" />}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Abas */}
      <View style={[styles.tabsRow, { backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('agenda')}
          style={[styles.tabBtn, activeTab === 'agenda' ? styles.tabBtnActive : null]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'agenda' ? styles.tabBtnTextActive : { color: themeColors.textSecondary }]}>
            Agenda Próxima ({events.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('fixos')}
          style={[styles.tabBtn, activeTab === 'fixos' ? styles.tabBtnActive : null]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'fixos' ? styles.tabBtnTextActive : { color: themeColors.textSecondary }]}>
            Cultos Semanais Fixos ({recurringSchedules.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal / Formulário de Cadastro */}
      {showModal && (
        <Card style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <Text style={[styles.formTitle, { color: themeColors.textPrimary }]}>
              {formMode === 'fixo' ? 'Novo Culto Fixo Semanal' : 'Novo Evento / Confraternização'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Input
            label="Título *"
            placeholder={formMode === 'fixo' ? 'Ex: Culto de Celebração ou Culto de Oração' : 'Ex: Confraternização dos Ministérios'}
            value={title}
            onChangeText={setTitle}
          />

          {formMode === 'fixo' ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.inputLabel, { color: themeColors.textPrimary }]}>Dia da Semana Fixo *</Text>
              <View style={styles.daysRow}>
                {[
                  { d: 0, name: 'Dom' },
                  { d: 2, name: 'Ter' },
                  { d: 3, name: 'Qua' },
                  { d: 4, name: 'Qui' },
                  { d: 5, name: 'Sex' },
                  { d: 6, name: 'Sáb' },
                ].map(item => {
                  const isSelected = dayOfWeek === item.d;
                  return (
                    <TouchableOpacity
                      key={item.d}
                      activeOpacity={0.8}
                      onPress={() => {
                        setDayOfWeek(item.d);
                        setDayName(item.d === 0 ? 'Domingo' : item.d === 2 ? 'Terça-feira' : item.d === 3 ? 'Quarta-feira' : item.d === 4 ? 'Quinta-feira' : item.d === 5 ? 'Sexta-feira' : 'Sábado');
                      }}
                      style={[
                        styles.dayBtn,
                        {
                          backgroundColor: isSelected 
                            ? (isDark ? '#DC2626' : '#0F172A')
                            : themeColors.cardBg,
                          borderColor: isSelected 
                            ? (isDark ? '#DC2626' : '#0F172A')
                            : themeColors.cardBorder,
                        }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.dayBtnText, 
                          { color: isSelected ? '#FFFFFF' : themeColors.textPrimary }
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <Input
              label="Data do Evento (YYYY-MM-DD) *"
              placeholder="Ex: 2026-11-20"
              value={eventDate}
              onChangeText={setEventDate}
            />
          )}

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Horário Início *"
                placeholder="19:00"
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Horário Término *"
                placeholder="21:00"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>

          <Input
            label="Local no Templo *"
            placeholder="Ex: Templo Principal ou Salão Social"
            value={location}
            onChangeText={setLocation}
          />

          <Button
            title="Publicar na Agenda da Igreja"
            onPress={handleSave}
            loading={loading}
            variant="primary"
            style={{ marginTop: 8 }}
          />
        </Card>
      )}

      {/* CONTEÚDO DA ABA 1: AGENDA PRÓXIMA (COM OPÇÃO DE CANCELAMENTO INDIVIDUAL) */}
      {activeTab === 'agenda' && (
        <View style={styles.listContainer}>
          {events.map(ev => {
            const isCancelled = ev.is_cancelled;
            return (
              <Card
                key={ev.id}
                style={[
                  styles.eventCard, 
                  isCancelled ? {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FFF5F5',
                    borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
                  } : null
                ]}
                accentColor={isCancelled ? (isDark ? '#F87171' : '#DC2626') : Colors.primary.DEFAULT}
              >
                {/* Header do Card */}
                <View style={styles.eventCardHeader}>
                  <Badge
                    label={isCancelled ? 'CANCELADO NESTA DATA' : ev.event_type === 'culto_fixo' ? 'CULTO FIXO' : 'EVENTO ESPECIAL'}
                    bgColor={
                      isCancelled 
                        ? themeColors.priority.urgente.bg 
                        : ev.event_type === 'culto_fixo' 
                        ? themeColors.priority.media.bg 
                        : themeColors.priority.alta.bg
                    }
                    textColor={
                      isCancelled 
                        ? themeColors.priority.urgente.text 
                        : ev.event_type === 'culto_fixo' 
                        ? themeColors.priority.media.text 
                        : themeColors.priority.alta.text
                    }
                  />

                  <Text style={[styles.eventDateText, { color: themeColors.textSecondary }]}>
                    {ev.event_date}
                  </Text>
                </View>

                <Text style={[styles.eventTitle, { color: themeColors.textPrimary }, isCancelled ? styles.strikethrough : null]}>
                  {ev.title}
                </Text>

                {ev.description && (
                  <Text style={[styles.eventDesc, { color: themeColors.textSecondary }]}>{ev.description}</Text>
                )}

                {/* Justificativa se cancelado */}
                {isCancelled && (
                  <View 
                    style={[
                      styles.cancelReasonBox,
                      {
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
                        borderColor: isDark ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
                        borderWidth: 1,
                      }
                    ]}
                  >
                    <AlertCircle size={16} color={isDark ? '#F87171' : '#DC2626'} />
                    <Text style={[styles.cancelReasonText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                      Motivo: {ev.cancelled_reason || 'Cancelado excepcionalmente.'}
                    </Text>
                  </View>
                )}

                {/* Detalhes de Horário e Local */}
                <View style={[styles.eventInfoBox, { borderTopColor: themeColors.cardBorder }]}>
                  <View style={styles.infoRow}>
                    <Clock size={14} color={Colors.primary.DEFAULT} />
                    <Text style={[styles.infoText, { color: themeColors.textPrimary }]}>
                      {ev.start_time} às {ev.end_time || '21:00'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MapPin size={14} color={themeColors.textSecondary} />
                    <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>{ev.location}</Text>
                  </View>
                </View>

                {/* Botão de Cancelamento Individual da Secretaria / Pastor */}
                {isSecretariaOrPastor && (
                  <View style={[styles.cardActionsRow, { borderTopColor: themeColors.cardBorder }]}>
                    {isCancelled ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleRestoreEvent(ev.id)}
                        style={[
                          styles.restoreBtn,
                          {
                            backgroundColor: themeColors.actions.successActionBg,
                            borderColor: themeColors.actions.successActionBorder,
                            borderWidth: 1,
                          }
                        ]}
                      >
                        <RotateCcw size={14} color={themeColors.actions.successActionText} />
                        <Text style={[styles.restoreBtnText, { color: themeColors.actions.successActionText }]}>
                          Reativar Culto Nesta Data
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleCancelEvent(ev.id, ev.title)}
                        style={[
                          styles.cancelBtn,
                          {
                            backgroundColor: themeColors.actions.destructiveBg,
                            borderColor: themeColors.actions.destructiveBorder,
                            borderWidth: 1,
                          }
                        ]}
                      >
                        <Ban size={14} color={themeColors.actions.destructiveText} />
                        <Text style={[styles.cancelBtnText, { color: themeColors.actions.destructiveText }]}>
                          Cancelar Esta Data Individualmente
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* CONTEÚDO DA ABA 2: CULTOS SEMANAIS FIXOS */}
      {activeTab === 'fixos' && (
        <View style={styles.listContainer}>
          {recurringSchedules.map(rec => (
            <Card key={rec.id} style={styles.eventCard} accentColor={isDark ? '#F87171' : '#0F172A'}>
              <View style={styles.eventCardHeader}>
                <Badge 
                  label={`TODO(A) ${rec.day_name.toUpperCase()}`} 
                  bgColor={themeColors.priority.baixa.bg} 
                  textColor={themeColors.priority.baixa.text} 
                />
                <Text style={[styles.recTimeBadge, { color: themeColors.priority.baixa.text }]}>
                  {rec.start_time} - {rec.end_time}
                </Text>
              </View>

              <Text style={[styles.eventTitle, { color: themeColors.textPrimary }]}>{rec.title}</Text>
              {rec.description && (
                <Text style={[styles.eventDesc, { color: themeColors.textSecondary }]}>{rec.description}</Text>
              )}

              <View style={styles.eventInfoBox}>
                <View style={styles.infoRow}>
                  <MapPin size={14} color={themeColors.textSecondary} />
                  <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>{rec.location}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  secretariaActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    minHeight: 44, // UI/UX Pro Max
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#DC2626',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formCard: {
    marginBottom: 16,
    borderColor: '#DC2626',
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  dayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  dayBtnTextSelected: {
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  listContainer: {
    gap: 10,
  },
  eventCard: {
    marginBottom: 10,
  },
  cancelledCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  eventDesc: {
    fontSize: 13,
    marginBottom: 8,
  },
  cancelReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  cancelReasonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  eventInfoBox: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardActionsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44, // UI/UX Pro Max
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  recTimeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});
