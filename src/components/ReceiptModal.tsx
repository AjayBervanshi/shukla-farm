import { formatINR, formatDate } from "@/lib/format";
import type { Booking } from "@/types/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ReceiptModal({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking: Booking | null;
}) {
  if (!booking) return null;
  const balance = Number(booking.total_amount) - Number(booking.advance_paid);
  const receiptNo = booking.id.slice(0, 8).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-gold/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl gold-text">Receipt</DialogTitle>
        </DialogHeader>

        <div className="print-area p-6 rounded-lg border border-gold/20 bg-background">
          <div className="text-center border-b border-gold/30 pb-4">
            <div className="font-display text-3xl gold-text">Shukla Farms</div>
            <div className="text-xs text-muted-foreground tracking-wider">
              NAGPUR'S PREMIER BANQUET VENUE
            </div>
          </div>

          <div className="flex justify-between text-sm mt-4">
            <div>
              <div className="text-xs text-muted-foreground">Receipt No.</div>
              <div className="font-mono-num">{receiptNo}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Date</div>
              <div className="font-mono-num">{formatDate(new Date())}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Client</div>
              <div className="font-semibold">{booking.client_name}</div>
              <div className="text-xs text-muted-foreground">{booking.phone}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Event</div>
              <div className="font-semibold">{booking.event_type}</div>
              <div className="text-xs text-muted-foreground">{booking.guests} guests</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Date</div>
              <div>{formatDate(booking.event_date)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Slot</div>
              <div>{booking.slot}</div>
            </div>
          </div>

          <table className="w-full mt-5 text-sm border-t border-gold/20">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2">Total Amount</td>
                <td className="py-2 text-right font-mono-num">{formatINR(booking.total_amount)}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2">Amount Paid</td>
                <td className="py-2 text-right font-mono-num text-green-500">
                  {formatINR(booking.advance_paid)}
                </td>
              </tr>
              <tr className="bg-gold/10">
                <td className="py-2 font-semibold">Balance Due</td>
                <td className="py-2 text-right font-mono-num font-semibold">
                  {formatINR(balance)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-gold/20">
            Thank you for choosing Shukla Farms!
            <br />
            Nagpur, Maharashtra
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            onClick={() => window.print()}
            className="bg-gold text-primary-foreground hover:bg-gold-light"
          >
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
