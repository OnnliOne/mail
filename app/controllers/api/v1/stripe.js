const Boom = require('@hapi/boom');
const Stripe = require('stripe');
const isSANB = require('is-string-and-not-blank');

const config = require('../../config');
const env = require('../../../../config/env');
const { Payments, Users } = require('../../../models');

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// <https://stripe.com/docs/webhooks/signatures>
async function webhook(ctx) {
  try {
    const sig = ctx.request.get('stripe-signature');

    // throw an error if something was wrong
    if (!isSANB(sig))
      throw Boom.badRequest(ctx.translateError('INVALID_STRIPE_SIGNATURE'));

    const event = stripe.webhooks.constructEvent(
      ctx.request.rawBody,
      sig,
      env.STRIPE_ENDPOINT_SECRET
    );

    // throw an error if something was wrong
    if (!event)
      throw Boom.badRequest(ctx.translateError('INVALID_STRIPE_SIGNATURE'));

    // handle the event
    const errors = [];
    if (event.type === 'invoice.payment_succeeded') {
      await onInvoicePaymentSucceededEvent(event, errors);
    }

    // NOTE: for now we just manually email admins of every event
    //       (and manual edits can be made as needed)

    // return a response to acknowledge receipt of the event
    ctx.body = { received: true };

    ctx.logger.info('stripe webhook', { event });

    // email admins here
    /*
    try {
      await email({
        template: 'alert',
        message: {
          to: config.email.message.from,
          subject: `Stripe Webhook: ${event.type}`
        },
        locals: {
          message: `<pre><code>${JSON.stringify(event, null, 2)}</code></pre>`
        }
      });
    } catch (err) {
      ctx.logger.fatal(err);
    }
    */
  } catch (err) {
    ctx.throw(err);
  }
}

async function onInvoicePaymentSucceededEvent(event, errors) {
  const invoice = event.data.object;

  // only deal with subscription invoices
  if (isSANB(invoice.subscription)) {
    // get user based on subscription id
    const user = await Users.findOne({
      [config.userFields.stripeSubscriptionID]: invoice.subscription
    })
      .lean()
      .exec();

    if (!user) {
      errors.push(new Error('Invoice is for unknown subscription.'));
      return;
    }

    const payment = await Payments.findOne({ stripe_invoice_id: invoice.id })
      .lean()
      .exec();

    if (payment) {
      // no need to do anything this has already been documented
    }

    // TODO make payment
  }
}

module.exports = webhook;
