from urllib.parse import quote
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        pass
    
    def generate_whatsapp_winner_link(self, phone_number: str, winner_info: dict) -> str:
        """
        Genera un enlace directo de WhatsApp para notificar al ganador
        """
        try:
            # Formatear el número de teléfono
            cleaned_phone = ''.join(filter(str.isdigit, phone_number))
            
            # Si no tiene código de país, asumimos que es de Cuba (+53)
            if not cleaned_phone.startswith('53') and len(cleaned_phone) <= 8:
                cleaned_phone = '53' + cleaned_phone
            
            # Crear el mensaje
            message = f"""
🎉 ¡Felicidades {winner_info['user_name']}! 🎉

Has ganado el {winner_info['position']}° premio en la rifa: 
"{winner_info['raffle_title']}"

Premio: {winner_info['prize_description']}
Número ganador: {winner_info['ticket_number']}

¡Gracias por participar! Confirma tu premio respondiendo este mensaje.
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
                        'ticket_number': winner.ticket_number
                    }
                )
                
                if whatsapp_link:
                    notification_links.append({
                        'winner_id': winner.id,
                        'winner_name': winner.user_name,
                        'winner_phone': winner.user_phone,
                        'position': winner.prize_position,
                        'whatsapp_link': whatsapp_link,
                        'ticket_number': winner.ticket_number
                    })
                    
            except Exception as e:
                logger.error(f"Error generando enlace para ganador {winner.id}: {str(e)}")
        
        return notification_links