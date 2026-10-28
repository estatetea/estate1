import PolicyPage from '@/components/PolicyPage';
// Estate Tea's privacy policy: what we collect from customers, why, who helps us process it, and how to have it removed.
export const metadata = {
  title: 'Privacy Policy · Estate Tea',
  description: 'How Estate Tea collects, uses and protects your personal information.',
};

const UPDATED = '28 October 2026';
const CONTACT = 'brew@estatetea.in';

const sections = [
  ['Who we are', [
    'Estate Tea sells premium black CTC tea powder from the Nilgiris to households and businesses in India. This policy explains how we handle personal information when you visit estatetea.in, place an order, pay us, or contact us by email or WhatsApp.',
    `If you have any question about this policy or your information, write to ${CONTACT}.`,
  ]],
  ['What we collect', [
    'Details you give us: your name, email address, phone or WhatsApp number, delivery address and PIN code, and, for businesses, your business name and GST number.',
    'Order details: what you ordered, the amount, your order number, delivery status and the delivery code we send you.',
    'Messages: the emails and WhatsApp messages you send us (including photos or voice notes you choose to send) and our replies.',
    'Payment confirmation: when you pay, our payment provider tells us whether the payment succeeded and gives us a payment reference. We never see or store your card, UPI PIN or bank login details.',
  ]],
  ['How we use it', [
    'To take, confirm, invoice, pack and deliver your order, and to send you order emails or messages (confirmation, on its way, delivered).',
    'To answer your questions and sort out any problem with an order.',
    'To keep the records the law requires, such as GST invoices.',
    'To send you occasional updates or offers, only if you have agreed to hear from us. You can say stop at any time and we will not contact you again for that purpose.',
    'We do not sell or rent your personal information to anyone.',
  ]],
  ['Who helps us', [
    'We use trusted service providers who process information only to provide their service to us: Razorpay (payments and invoices), Resend (sending and receiving email), Meta / WhatsApp Business (WhatsApp messages), Vercel (hosting our website and systems), MongoDB Atlas (our database), and AI services that help our team draft replies and run our internal assistant: Google (Gemini), Groq and ElevenLabs (voice), with OpenAI used only if we switch it on. A person at Estate Tea oversees these replies, and anything about payments, problems or refunds is always handled by a person. Couriers receive your name, phone number and address when they deliver your order.',
    'We may share information if the law requires it, for example with tax authorities.',
  ]],
  ['How long we keep it', [
    'We keep order and invoice records for as long as Indian tax law requires (generally eight years). Other information, such as messages, is kept while you are a customer and for a reasonable time after, unless you ask us to delete it sooner.',
  ]],
  ['Your choices and rights', [
    'You can ask us to show you, correct, or delete the personal information we hold about you, or to stop sending you messages. Write to us at ' + CONTACT + ' or send us a WhatsApp message saying so, and we will act on it within 30 days. Records we must keep by law (such as invoices) are kept until that period ends.',
    'Deleting your data: to have your information removed, email ' + CONTACT + ' with the subject "Delete my data" from the email address or phone number you used with us.',
  ]],
  ['Keeping it safe', [
    'Your information is stored with providers that use encryption and access controls, and only the people and systems that need it to run Estate Tea can access it.',
  ]],
  ['Changes', [
    'If we change this policy we will update this page and the date below.',
  ]],
];

export default function PrivacyPage() {
  return <PolicyPage title="Privacy Policy" updated={UPDATED} sections={sections} />;
}
