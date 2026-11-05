import { Linking, Alert, Platform } from 'react-native';

/**
 * Sanitiza o número de telefone para o padrão internacional do WhatsApp.
 * Remove caracteres especiais, parênteses e traços. Se não houver DDI, assume Brasil (+55).
 */
export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Abre o WhatsApp com uma mensagem pré-formatada.
 */
export async function openWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  const cleanPhone = formatWhatsAppPhone(phone);
  if (!cleanPhone) {
    Alert.alert('Telefone Inválido', 'O usuário não possui um número de telefone cadastrado com WhatsApp.');
    return false;
  }

  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
  const webFallbackUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  try {
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      await Linking.openURL(webFallbackUrl);
      return true;
    }
  } catch (err) {
    console.error('Erro ao abrir WhatsApp:', err);
    try {
      await Linking.openURL(webFallbackUrl);
      return true;
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp neste aparelho.');
      return false;
    }
  }
}

/**
 * Mensagens contextualizadas prontas
 */
export const WhatsAppMessages = {
  // Pastor para Líder sobre uma Meta
  goalAlignment: (leaderName: string, goalTitle: string, dueDateFormatted: string) => {
    return `Olá Líder ${leaderName}! A paz do Senhor.\n\nReferente à meta *"${goalTitle}"* da nossa Igreja Metodista Aliado com prazo para ${dueDateFormatted}, gostaria de alinhar um detalhe com você.`;
  },

  // Pastor para Líder respondendo a uma Dúvida
  doubtResponse: (leaderName: string, goalTitle: string, doubtSnippet: string) => {
    return `Olá Líder ${leaderName}! A paz do Senhor.\n\nVi a sua dúvida na meta *"${goalTitle}"*: _"${doubtSnippet}"_.\nPodemos conversar a respeito?`;
  },

  // Felicitações de Aniversário
  birthdayWish: (memberName: string, isPastor = true) => {
    return `A paz do Senhor, irmão(ã) ${memberName}! 🎉🎂\n\nEm nome da *Igreja Metodista Aliado*, desejamos um abençoado Feliz Aniversário! Que o Senhor derrame ricas bênçãos sobre sua vida, família e ministério neste novo ciclo de vida!`;
  },

  // Pastor para Líder sobre Comprovante de Gasto
  expenseReview: (leaderName: string, description: string, amountFormatted: string) => {
    return `Olá Líder ${leaderName}! A paz do Senhor.\n\nReferente ao comprovante enviado de *${amountFormatted}* (${description}) para a Igreja Aliado, gostaria de tirar uma dúvida sobre o recibo.`;
  },

  // Líder para Voluntário sobre Escala
  scheduleNotice: (volunteerName: string, eventTitle: string, dateFormatted: string, role: string) => {
    return `Olá ${volunteerName}! A paz do Senhor.\n\nVocê está escalado(a) na Igreja Metodista Aliado para o *${eventTitle}* no dia ${dateFormatted} na função: *${role}*. Por favor, confirme sua presença no aplicativo!`;
  }
};
