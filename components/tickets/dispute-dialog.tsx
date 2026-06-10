"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Confirm-only dispute flow. No real submission — this is a mockup. */
export function DisputeDialog({ ticketId }: { ticketId: string }) {
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <Dialog onOpenChange={(open) => !open && setSubmitted(false)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="size-4" />
          Dispute this ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        {submitted ? (
          <>
            <DialogHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-5" />
              </div>
              <DialogTitle>Dispute submitted</DialogTitle>
              <DialogDescription>
                We&apos;ve flagged {ticketId} for review. The Bond team will follow up within 2
                business days. Owed amounts are paused while we look into it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
                <AlertTriangle className="size-5" />
              </div>
              <DialogTitle>Dispute {ticketId}?</DialogTitle>
              <DialogDescription>
                Open a dispute if this ticket looks wrong — a misread receipt, an item that
                shouldn&apos;t have qualified, or a payback you didn&apos;t agree to. Bond will
                review the scanned receipt and get back to you.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={() => setSubmitted(true)}>
                Submit dispute
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
