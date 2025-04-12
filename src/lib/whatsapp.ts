const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';
const PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN;

export const sendWhatsAppNotification = async (
  to: string, 
  templateName: string,
  variables?: string[] // Change to accept an array of strings
) => {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: variables
            ? [
                {
                  type: 'body',
                  parameters: variables.map((value) => ({
                    type: 'text',
                    text: value || 'N/A', // Fallback to 'N/A' if value is missing
                  })),
                },
              ]
            : undefined,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error sending WhatsApp notification:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error sending WhatsApp notification:', error.message);
    } else {
      console.error('Error sending WhatsApp notification:', error);
    }
    throw error;
  }
};