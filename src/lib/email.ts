import { Resend } from "resend";
import { format } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@chairtime.app";

export async function sendBookingConfirmation({
  attendeeName,
  attendeeEmail,
  barberName,
  serviceName,
  startTime,
  duration,
}: {
  attendeeName: string;
  attendeeEmail: string;
  barberName: string;
  serviceName: string;
  startTime: Date;
  duration: number;
}) {
  const dateStr = format(startTime, "EEEE, MMMM d 'at' h:mm a");

  await resend.emails.send({
    from: FROM,
    to: attendeeEmail,
    subject: `Booking confirmed: ${serviceName} with ${barberName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #18181b; margin-bottom: 8px;">
          You're booked!
        </h1>
        <p style="color: #71717a; margin-bottom: 24px;">Hi ${attendeeName},</p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #18181b;">${serviceName}</p>
          <p style="margin: 0 0 4px; color: #52525b; font-size: 14px;">with ${barberName}</p>
          <p style="margin: 0; color: #52525b; font-size: 14px;">${dateStr}</p>
          <p style="margin: 4px 0 0; color: #71717a; font-size: 13px;">${duration} min</p>
        </div>
        <p style="color: #71717a; font-size: 13px;">
          Need to cancel or reschedule? Reply to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">Powered by ChairTime</p>
      </div>
    `,
  });
}

export async function sendBarberBookingNotification({
  barberEmail,
  barberName,
  attendeeName,
  attendeeEmail,
  attendeePhone,
  serviceName,
  startTime,
}: {
  barberEmail: string;
  barberName: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string | null;
  serviceName: string;
  startTime: Date;
}) {
  const dateStr = format(startTime, "EEEE, MMMM d 'at' h:mm a");

  await resend.emails.send({
    from: FROM,
    to: barberEmail,
    subject: `New booking: ${attendeeName} — ${serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 16px;">
          New booking
        </h1>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #18181b;">${attendeeName}</p>
          <p style="margin: 0 0 4px; color: #52525b; font-size: 14px;">${attendeeEmail}</p>
          ${attendeePhone ? `<p style="margin: 0 0 4px; color: #52525b; font-size: 14px;">${attendeePhone}</p>` : ""}
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 12px 0;" />
          <p style="margin: 0 0 4px; font-weight: 500; color: #18181b; font-size: 14px;">${serviceName}</p>
          <p style="margin: 0; color: #71717a; font-size: 14px;">${dateStr}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">ChairTime — chairtime.app</p>
      </div>
    `,
  });
}

export async function sendCancellationEmail({
  attendeeEmail,
  attendeeName,
  barberName,
  serviceName,
  startTime,
}: {
  attendeeEmail: string;
  attendeeName: string;
  barberName: string;
  serviceName: string;
  startTime: Date;
}) {
  await resend.emails.send({
    from: FROM,
    to: attendeeEmail,
    subject: `Booking cancelled: ${serviceName} with ${barberName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 8px;">Booking Cancelled</h1>
        <p style="color: #71717a; margin-bottom: 16px;">Hi ${attendeeName}, your booking has been cancelled.</p>
        <p style="color: #52525b; font-size: 14px;">
          ${serviceName} with ${barberName} on ${format(startTime, "MMMM d 'at' h:mm a")}
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">Powered by ChairTime</p>
      </div>
    `,
  });
}
