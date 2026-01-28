from urllib.parse import quote
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        pass
    
    def format_phone_number(self, phone_number: str) -> str:
        """Formatea el número de teléfono para WhatsApp"""
        try:
            # Limpiar el número
            cleaned = ''.join(filter(str.isdigit, str(phone_number)))
            
            # Si no tiene código de país, asumimos que es de Cuba (+53)
            if not cleaned.startswith('53') and len(cleaned) <= 8:
                cleaned = '53' + cleaned
            
            return cleaned
        except Exception as e:
            logger.error(f"Error formateando teléfono {phone_number}: {str(e)}")
            return phone_number
    
    def generate_whatsapp_winner_link(self, phone_number: str, winner_info: Dict[str, Any]) -> str:
        """
        Genera un enlace directo de WhatsApp para notificar al ganador
        """
        try:
            # Formatear el número de teléfono
            cleaned_phone = self.format_phone_number(phone_number)
            
            if not cleaned_phone:
                raise ValueError("Número de teléfono inválido")
            
            # Crear el mensaje
            message = f"""
🎉 ¡Felicidades {winner_info.get('user_name', 'Ganador')}! 🎉

Has ganado el {winner_info.get('position', '')}° premio en la rifa: 
"{winner_info.get('raffle_title', '')}"

🏆 Premio: {winner_info.get('prize_description', '')}
🎫 Número ganador: {winner_info.get('ticket_number', '')}

¡Gracias por participar! Confirma tu premio respondiendo este mensaje.

Fecha: {winner_info.get('draw_date', datetime.now().strftime('%d/%m/%Y'))}
            """.strip()
            
            # Codificar el mensaje para URL
            encoded_message = quote(message)
            
            # Crear enlace de WhatsApp
            whatsapp_link = f"https://wa.me/{cleaned_phone}?text={encoded_message}"
            
            logger.info(f"Enlace WhatsApp generado para {phone_number}")
            return whatsapp_link
            
        except Exception as e:
            logger.error(f"Error generando enlace WhatsApp: {str(e)}")
            return None
    
    def generate_admin_notification_links(self, winners: list) -> list:
        """
        Genera enlaces para que el admin notifique a todos los ganadores
        """
        notification_links = []
        
        for winner in winners:
            try:
                whatsapp_link = self.generate_whatsapp_winner_link(
                    winner.user_phone,
                    {
                        'user_name': winner.user_name,
                        'position': winner.prize_position,
                        'raffle_title': winner.raffle.title,
                        'prize_description': winner.prize_description,
                        'ticket_number': winner.ticket_number,
                        'draw_date': winner.created_at.strftime('%d/%m/%Y') if hasattr(winner.created_at, 'strftime') else ''
                    }
                )
                
                if whatsapp_link:
                    notification_links.append({
                        'winner_id': winner.id,
                        'winner_name': winner.user_name,
                        'winner_phone': winner.user_phone,
                        'position': winner.prize_position,
                        'whatsapp_link': whatsapp_link,
                        'ticket_number': winner.ticket_number,
                        'prize': winner.prize_description
                    })
                    
            except Exception as e:
                logger.error(f"Error generando enlace para ganador {winner.id}: {str(e)}")
        
        return notification_links
    
    def generate_payment_notification(self, admin_phone: str, purchase_info: Dict[str, Any]) -> str:
        """
        Genera enlace para notificar a un administrador sobre un pago pendiente
        """
        try:
            cleaned_phone = self.format_phone_number(admin_phone)
            
            message = f"""
💰 PAGO PENDIENTE DE CONFIRMACIÓN 💰

Cliente: {purchase_info.get('user_name', '')}
Teléfono: {purchase_info.get('user_phone', '')}
Rifa: {purchase_info.get('raffle_title', '')}
Cantidad: {purchase_info.get('ticket_count', 0)} boleto(s)
Números: {', '.join(map(str, purchase_info.get('ticket_numbers', [])))}
Total: ${purchase_info.get('total_amount', 0):.2f}

⚠️ Confirmar pago cuando el cliente haya transferido.
            """.strip()
            
            encoded_message = quote(message)
            return f"https://wa.me/{cleaned_phone}?text={encoded_message}"
            
        except Exception as e:
            logger.error(f"Error generando notificación de pago: {str(e)}")
            return None