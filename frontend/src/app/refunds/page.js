// Estate Tea's refund and cancellation policy. Brew's playbook (estate-tea-brew app/playbook.py) follows the same rules.
import PolicyPage from '@/components/PolicyPage';

export const metadata = {
  title: 'Refunds & Cancellations · Estate Tea',
  description: 'How to cancel an Estate Tea order, what we do if something is wrong, and how refunds are paid.',
};

const CONTACT = 'brew@estatetea.in';

const sections = [
  ['Cancelling an order', [
    'You can cancel any time before your order is dispatched. Send us a WhatsApp message or email ' + CONTACT + ' with your order number (it starts with ET-), and we will refund you in full, including any delivery charge.',
    'Once your order has been dispatched (we send you an "on its way" message with your delivery code), it can no longer be cancelled. If something is wrong when it arrives, see below.',
    'If you have an invoice you have not paid yet, simply do not pay it, or tell us and we will cancel it. Nothing is charged until you pay.',
  ]],
  ['Returns', [
    'Our tea is a food product. To keep every pack fresh and safe, we cannot take back opened packs or accept returns because you changed your mind.',
  ]],
  ['Damaged, wrong or missing items', [
    'If your pack arrives damaged, you receive the wrong item, or something is missing, tell us within 48 hours of delivery. Please send a photo of the pack and its label.',
    'We will send you a replacement or give you a full refund for the affected item, whichever you prefer. You do not need to send anything back unless we ask.',
  ]],
  ['If something is not right with the tea', [
    'If the tea does not seem right (for example it smells stale or contains something it should not), tell us within 7 days of delivery with a photo. We will look into it and replace the pack or refund it.',
  ]],
  ['Late or lost deliveries', [
    'If your order has not reached you within 7 days of dispatch, please contact us. If it has been lost on the way, we will send it again or refund you in full, whichever you prefer.',
  ]],
  ['How refunds are paid', [
    'Refunds go back to the way you paid (UPI, card or net banking) through our payment provider, Razorpay. We start the refund within 2 working days of agreeing it; your bank usually takes 5 to 7 working days to show it.',
    'A full refund includes the GST and any delivery charge you paid.',
  ]],
  ['Business orders', [
    'The same rules apply to business orders. Free samples are, of course, free, so there is nothing to refund.',
  ]],
  ['Contact us', [
    `Email ${CONTACT} or message us on WhatsApp with your order number. We reply as quickly as we can, usually the same day.`,
  ]],
];

export default function RefundsPage() {
  return <PolicyPage title="Refunds & Cancellations" updated="28 October 2026" sections={sections} />;
}
