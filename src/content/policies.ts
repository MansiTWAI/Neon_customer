export interface Policy {
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

/**
 * Customer policies. The operational numbers here (payment window, proof revisions, return window)
 * match what the platform enforces, so change them together.
 */
export const POLICIES: Record<string, Policy> = {
  shipping: {
    title: 'Shipping and delivery',
    summary: 'How and when your sign reaches you.',
    sections: [
      {
        heading: 'When we dispatch',
        body: [
          'Every sign is made to order. Production starts once your payment is received and you have approved the design proof, and takes five to seven working days for most signs.',
          'The delivery estimate shown at checkout for your pincode counts from the day you approve the proof.',
        ],
      },
      {
        heading: 'Delivery charges',
        body: [
          'Delivery is free within cities where we have a partner studio. Elsewhere in India a flat charge is shown at checkout, and it is waived on larger orders.',
        ],
      },
      {
        heading: 'Packing and tracking',
        body: [
          'Signs are packed in a rigid box with foam corners. Once your order ships you will find the courier and tracking number on your order page, and we send the same on WhatsApp.',
          'Please check the box before signing for it. If it is visibly damaged, note it on the courier receipt and photograph it.',
        ],
      },
      {
        heading: 'Installation',
        body: [
          'In cities where installation is offered, a technician calls you to book a slot once your sign is ready and mounts and tests it with you.',
        ],
      },
    ],
  },
  returns: {
    title: 'Cancellations, returns and refunds',
    summary: 'What happens if something is not right.',
    sections: [
      {
        heading: 'Cancelling an order',
        body: [
          'You can cancel from your order page until production starts. If you have already paid, raise a request from the order page and we refund the full amount to the original payment method within five to seven working days.',
          'Once production has started the sign is being made to your design, so the order can no longer be cancelled.',
        ],
      },
      {
        heading: 'Damaged or faulty signs',
        body: [
          'Tell us within 7 days of delivery by raising a request on the order page with a photo. We repair or remake the sign at no cost, including the courier both ways.',
        ],
      },
      {
        heading: 'Custom designs',
        body: [
          'Because every sign is made to your approved proof, we cannot take back a sign that matches the proof you approved. That is why we send the proof first, with up to three rounds of changes included.',
        ],
      },
    ],
  },
  warranty: {
    title: 'Warranty',
    summary: 'One year on the parts that matter.',
    sections: [
      {
        heading: 'What is covered',
        body: [
          'The LED neon strip, the power adapter and the dimmer, if you chose one, are covered for one year from delivery against defects in materials and workmanship.',
        ],
      },
      {
        heading: 'What is not covered',
        body: [
          'Physical damage after delivery, water damage to indoor signs, cut or altered cables, and use with a different power adapter.',
        ],
      },
      {
        heading: 'Making a claim',
        body: [
          'Raise a request from your order page with a short video of the fault. We will repair or replace the part.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy',
    summary: 'What we collect, and what we do with it.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Your mobile number to sign you in, your name, email and addresses to deliver and invoice your orders, and the designs and files you upload.',
          'Photos of your wall used in the studio stay on your device and are never uploaded.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To make and deliver your order, to send you order updates on WhatsApp or by notification, and to issue GST invoices. We share your delivery details only with our courier and, if you booked installation, the technician.',
          'We do not sell your data or send marketing messages without your consent.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You can edit your details, delete saved addresses and designs, and close your account from your account page. Invoices for past orders are kept as the law requires.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of sale',
    summary: 'The short version of how ordering works.',
    sections: [
      {
        heading: 'Prices',
        body: [
          'Prices are worked out from the size of the sign and the options you choose, and include GST. The price confirmed at checkout is the price you pay.',
        ],
      },
      {
        heading: 'Payment',
        body: [
          'After you place an order we send a secure payment link. Orders that are not paid within 48 hours may be released. Larger orders can be paid half in advance and half before dispatch.',
        ],
      },
      {
        heading: 'Design proofs',
        body: [
          'We send a design proof for every sign before it is made. Three rounds of changes are included. Production starts only after you approve the proof.',
        ],
      },
      {
        heading: 'Your content',
        body: [
          'You confirm that you have the right to use any words, names and logos you ask us to make. We may decline designs that infringe the rights of others.',
        ],
      },
    ],
  },
};
