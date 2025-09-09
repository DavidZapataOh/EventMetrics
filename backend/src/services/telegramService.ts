import axios from 'axios';

interface TelegramMessage {
    organizationName: string;
    website: string;
    twitter?: string;
    description: string;
    reference?: string;
    requestedRole: string;
    requestId: string;
    userData: {
        name: string;
        email: string;
        handle: string;
    };
}

class TelegramService {
    private botToken: string;
    private chatId: string;
    private approverIds: string[];

    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
        this.approverIds = (process.env.TELEGRAM_APPROVER_IDS || '').split(',').map(id => id.trim());
        
        if (!this.botToken || !this.chatId) {
            console.warn('Telegram bot token or chat ID not configured');
        }
    }

    async sendOrganizationRequest(message: TelegramMessage): Promise<number | null> {
        if (!this.botToken || !this.chatId) {
            console.error('Telegram not configured');
            return null;
        }

        try {
            const messageText = this.formatRequestMessage(message);
            const inlineKeyboard = this.createApprovalKeyboard(message.requestId);

            const response = await axios.post(
                `https://api.telegram.org/bot${this.botToken}/sendMessage`,
                {
                    chat_id: this.chatId,
                    text: messageText,
                    reply_markup: inlineKeyboard,
                    parse_mode: 'HTML'
                }
            );

            return response.data.result.message_id;
        } catch (error) {
            console.error('Error sending Telegram message:', error);
            return null;
        }
    }

    private formatRequestMessage(message: TelegramMessage): string {
        let text = `🏢 <b>Nueva Solicitud de Organización</b>\n\n`;
        text += `📋 <b>Organización:</b> ${message.organizationName}\n`;
        text += `🌐 <b>Website:</b> ${message.website}\n`;
        
        if (message.twitter) {
            text += `🐦 <b>Twitter:</b> @${message.twitter.replace('@', '')}\n`;
        }
        
        text += `👤 <b>Rol solicitado:</b> ${message.requestedRole}\n\n`;
        text += `📝 <b>Descripción:</b>\n${message.description}\n\n`;
        
        if (message.reference) {
            text += `🔗 <b>Referencia:</b> ${message.reference}\n\n`;
        }
        
        text += `👨‍💼 <b>Solicitante:</b>\n`;
        text += `• Nombre: ${message.userData.name}\n`;
        text += `• Email: ${message.userData.email}\n`;
        text += `• Handle: @${message.userData.handle}\n`;
        text += `\n⏰ <i>Enviado: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' })}</i>`;

        return text;
    }

    private createApprovalKeyboard(requestId: string) {
        return {
            inline_keyboard: [
                [
                    {
                        text: '✅ Aprobar',
                        callback_data: `approve_org_${requestId}`
                    },
                    {
                        text: '❌ Rechazar',
                        callback_data: `reject_org_${requestId}`
                    }
                ]
            ]
        };
    }

    async setupWebhook(): Promise<void> {
        if (!this.botToken) return;

        try {
            const webhookUrl = `${process.env.BACKEND_URL}/api/telegram/webhook`;
            await axios.post(
                `https://api.telegram.org/bot${this.botToken}/setWebhook`,
                {
                    url: webhookUrl
                }
            );
            console.log('Telegram webhook configured successfully');
        } catch (error) {
            console.error('Error setting up Telegram webhook:', error);
        }
    }

    isApprover(userId: string): boolean {
        return this.approverIds.includes(userId);
    }

    async updateMessage(messageId: number, newText: string): Promise<void> {
        if (!this.botToken || !this.chatId) return;

        try {
            await axios.post(
                `https://api.telegram.org/bot${this.botToken}/editMessageText`,
                {
                    chat_id: this.chatId,
                    message_id: messageId,
                    text: newText,
                    parse_mode: 'HTML'
                }
            );
        } catch (error) {
            console.error('Error updating Telegram message:', error);
        }
    }
}

export default new TelegramService();