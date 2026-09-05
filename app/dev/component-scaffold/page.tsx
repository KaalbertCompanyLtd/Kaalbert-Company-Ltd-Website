"use client";

/**
 * Scratch verification page for T1.4 (shadcn/ui + Base UI component scaffold) — not a real
 * public page type, no SEO metadata. Renders at least one themed instance of every
 * foundation-layer primitive listed in ui/components.md's "Foundation layer — shadcn/ui
 * primitives (on Base UI)" so they can be checked against the T1.3 token set.
 */

import { useState } from "react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="font-display text-h2 text-primary mb-4 font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentScaffoldTestPage() {
  const [progress, setProgress] = useState(40);

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <span className="text-kicker text-accent mb-2 block font-semibold tracking-[0.08em] uppercase">
          T1.4 — scratch verification
        </span>
        <h1 className="font-display text-h1 text-primary mb-2 font-bold">
          shadcn/ui + Base UI component scaffold
        </h1>
        <p className="text-lead text-muted-foreground mb-12 max-w-2xl font-light">
          One themed instance of every foundation-layer primitive from ui/components.md, restyled
          against the T1.3 token set — Button, Input, Textarea, Select, Checkbox, RadioGroup,
          Switch, Card, Dialog, AlertDialog, Accordion, Tabs, Badge, Table, Avatar, Tooltip,
          DropdownMenu, Popover, Progress, Separator, Sonner, Field (Form).
        </p>

        <Section title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        <Section title="Card">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Business Health Check</CardTitle>
              <CardDescription>
                A structured, partner-led read of where your business really stands.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-foreground">From GHS 1,000 · scope-capped</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">See the full offer</Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="Input / Textarea / Select / Field (Form)">
          <FieldGroup className="max-w-md">
            <Field>
              <FieldLabel htmlFor="full-name">Full name</FieldLabel>
              <Input id="full-name" placeholder="Ama Owusu" />
            </Field>
            <Field data-invalid="true">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="ama@example.com" aria-invalid />
              <FieldError>Enter a valid email address.</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="engagement">What do you need help with?</FieldLabel>
              <Select
                defaultValue="health-check"
                items={{
                  "health-check": "Business Health Check",
                  "financial-clarity": "Financial Clarity Pack",
                  "funding-readiness": "Funding-Readiness Pack",
                }}
              >
                <SelectTrigger id="engagement" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health-check">Business Health Check</SelectItem>
                  <SelectItem value="financial-clarity">Financial Clarity Pack</SelectItem>
                  <SelectItem value="funding-readiness">Funding-Readiness Pack</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea id="notes" rows={4} placeholder="Anything else we should know?" />
              <FieldDescription>Optional — used only to route your enquiry.</FieldDescription>
            </Field>
          </FieldGroup>
        </Section>

        <Section title="Checkbox / RadioGroup / Switch">
          <div className="flex flex-wrap items-start gap-10">
            <Field orientation="horizontal" className="w-fit">
              <Checkbox id="consent-contact" defaultChecked />
              <FieldLabel htmlFor="consent-contact">Contact consent</FieldLabel>
            </Field>
            <RadioGroup defaultValue="whatsapp" className="gap-2">
              <Field orientation="horizontal" className="w-fit">
                <RadioGroupItem value="whatsapp" id="contact-whatsapp" />
                <FieldLabel htmlFor="contact-whatsapp">WhatsApp</FieldLabel>
              </Field>
              <Field orientation="horizontal" className="w-fit">
                <RadioGroupItem value="email" id="contact-email" />
                <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              </Field>
            </RadioGroup>
            <Field orientation="horizontal" className="w-fit">
              <Switch id="marketing-consent" />
              <FieldLabel htmlFor="marketing-consent">Marketing consent</FieldLabel>
            </Field>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="overview" className="max-w-md">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="scope">Scope</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">Overview content.</TabsContent>
            <TabsContent value="scope">Scope content.</TabsContent>
            <TabsContent value="fees">Fees content.</TabsContent>
          </Tabs>
        </Section>

        <Section title="Accordion">
          <Accordion defaultValue={["item-1"]} className="max-w-md">
            <AccordionItem value="item-1">
              <AccordionTrigger>What does the diagnostic cover?</AccordionTrigger>
              <AccordionContent>
                Four to five business-health dimensions, scored from your answers.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How long does it take?</AccordionTrigger>
              <AccordionContent>Under six minutes, start to summary.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Section title="Table">
          <Table>
            <TableCaption>Recent enquiries</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Ama Owusu</TableCell>
                <TableCell>Business Health Check</TableCell>
                <TableCell>
                  <Badge variant="secondary">New</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Kwesi Mensah</TableCell>
                <TableCell>Funding-Readiness Pack</TableCell>
                <TableCell>
                  <Badge variant="outline">Contacted</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section title="Avatar">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="/brand/logo-primary.png" alt="" />
              <AvatarFallback>KC</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>AO</AvatarFallback>
            </Avatar>
          </div>
        </Section>

        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
            <TooltipContent>Scope-capped fee, agreed before work begins.</TooltipContent>
          </Tooltip>
        </Section>

        <Section title="Popover">
          <Popover>
            <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
            <PopoverContent>
              <p className="text-body text-foreground">Popover content, themed.</p>
            </PopoverContent>
          </Popover>
        </Section>

        <Section title="DropdownMenu">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline">Core Offers</Button>} />
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Offers</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Business Health Check</DropdownMenuItem>
                <DropdownMenuItem>Financial Clarity Pack</DropdownMenuItem>
                <DropdownMenuItem>Funding-Readiness Pack</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        <Section title="Dialog">
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request your summary</DialogTitle>
                <DialogDescription>
                  We&rsquo;ll email your Business Health Check summary once it&rsquo;s ready.
                </DialogDescription>
              </DialogHeader>
              <Field>
                <FieldLabel htmlFor="dialog-email">Email</FieldLabel>
                <Input id="dialog-email" type="email" placeholder="ama@example.com" />
              </Field>
              <DialogFooter>
                <Button>Send summary</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Section title="AlertDialog">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive">Delete enquiry</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this enquiry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone once confirmed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Section title="Progress">
          <div className="max-w-md space-y-3">
            <Progress value={progress} />
            <Button variant="outline" onClick={() => setProgress((p) => (p >= 100 ? 20 : p + 20))}>
              Advance progress
            </Button>
          </div>
        </Section>

        <Section title="Separator">
          <p className="text-body text-foreground">Above the separator.</p>
          <Separator className="my-4" />
          <p className="text-body text-foreground">Below the separator.</p>
        </Section>

        <Section title="Sonner (toast)">
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Enquiry submitted", {
                description: "We'll reply within one business day.",
              })
            }
          >
            Trigger toast
          </Button>
          <Toaster />
        </Section>
      </main>
    </TooltipProvider>
  );
}
