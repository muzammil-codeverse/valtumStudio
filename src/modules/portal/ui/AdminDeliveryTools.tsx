import {
  editDeliveryItemAction,
  updateClientInvoiceAction,
  updateDeliveryPlanAction
} from "@/modules/portal/server/delivery-management-actions";

function inputDate(value?: Date | null): string {
  return value?.toISOString().slice(0, 10) ?? "";
}

type Item = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  revision: number;
};

type Invoice = {
  id: string;
  reference: string;
  status: string;
  currency: string;
  amountCents: number;
  paymentReference: string | null;
};

export function AdminDeliveryTools({
  engagement
}: Readonly<{
  engagement: {
    id: string;
    title: string;
    summary: string | null;
    startDate: Date | null;
    targetDate: Date | null;
    tasks: readonly Item[];
    milestones: readonly Item[];
    invoices: readonly Invoice[];
  };
}>): React.JSX.Element {
  return (
    <section
      className="delivery-workroom delivery-management"
      aria-labelledby="delivery-manage-title"
    >
      <header className="delivery-workroom-heading">
        <div>
          <h2 id="delivery-manage-title">Plan, refine, deliver.</h2>
          <p>Manage the real schedule, task briefs and manually confirmed billing.</p>
        </div>
      </header>
      <div className="delivery-management-grid">
        <section className="delivery-workroom-panel">
          <div className="delivery-panel-top">
            <div>
              <h3>Project plan</h3>
              <p>Make every delivery date explicit and accurate.</p>
            </div>
          </div>
          <form action={updateDeliveryPlanAction} className="delivery-compose-form">
            <input type="hidden" name="engagementId" value={engagement.id} />
            <label htmlFor="plan-title">Project title</label>
            <input
              id="plan-title"
              name="title"
              required
              minLength={2}
              maxLength={160}
              defaultValue={engagement.title}
            />
            <label htmlFor="plan-summary">Customer-facing project summary</label>
            <textarea
              id="plan-summary"
              name="summary"
              rows={4}
              maxLength={3000}
              defaultValue={engagement.summary ?? ""}
            />
            <div className="delivery-date-pair">
              <div>
                <label htmlFor="plan-start">Start date</label>
                <input
                  id="plan-start"
                  type="date"
                  name="startDate"
                  defaultValue={inputDate(engagement.startDate)}
                />
              </div>
              <div>
                <label htmlFor="plan-target">Target date</label>
                <input
                  id="plan-target"
                  type="date"
                  name="targetDate"
                  defaultValue={inputDate(engagement.targetDate)}
                />
              </div>
            </div>
            <button type="submit">Save project plan</button>
          </form>
        </section>
        <section className="delivery-workroom-panel">
          <div className="delivery-panel-top">
            <div>
              <h3>Milestones and task briefs</h3>
              <p>Edit descriptions and dates without losing the delivery history.</p>
            </div>
          </div>
          {engagement.milestones.length === 0 && engagement.tasks.length === 0 ? (
            <p className="delivery-empty">
              Create a milestone or task to start the delivery plan.
            </p>
          ) : (
            <div className="delivery-editor-list">
              {[
                ...engagement.milestones.map((item) => ({
                  ...item,
                  kind: "milestone" as const
                })),
                ...engagement.tasks.map((item) => ({ ...item, kind: "task" as const }))
              ].map((item) => (
                <details key={item.kind + item.id} className="delivery-editor-item">
                  <summary>
                    <span>{item.title}</span>
                    <small>{item.kind === "task" ? "Task" : "Milestone"}</small>
                  </summary>
                  <form action={editDeliveryItemAction}>
                    <input type="hidden" name="engagementId" value={engagement.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="kind" value={item.kind} />
                    <input type="hidden" name="revision" value={item.revision} />
                    <label htmlFor={"editor-title-" + item.id}>Title</label>
                    <input
                      id={"editor-title-" + item.id}
                      name="title"
                      required
                      minLength={2}
                      maxLength={160}
                      defaultValue={item.title}
                    />
                    <label htmlFor={"editor-description-" + item.id}>Description</label>
                    <textarea
                      id={"editor-description-" + item.id}
                      name="description"
                      rows={3}
                      maxLength={4000}
                      defaultValue={item.description ?? ""}
                    />
                    <label htmlFor={"editor-date-" + item.id}>Due date</label>
                    <input
                      id={"editor-date-" + item.id}
                      type="date"
                      name="dueDate"
                      defaultValue={inputDate(item.dueDate)}
                    />
                    <button type="submit">Save {item.kind}</button>
                  </form>
                </details>
              ))}
            </div>
          )}
        </section>
        <section
          className="delivery-workroom-panel delivery-invoice-editor"
          id="billing"
        >
          <div className="delivery-panel-top">
            <div>
              <h3>Invoice status ledger</h3>
              <p>
                Record a payment only after confirming settlement outside this
                application.
              </p>
            </div>
          </div>
          {engagement.invoices.length === 0 ? (
            <p className="delivery-empty">No invoices recorded for this project.</p>
          ) : (
            engagement.invoices.map((invoice) => (
              <div className="delivery-invoice-row" key={invoice.id}>
                <div className="delivery-invoice-head">
                  <strong>{invoice.reference}</strong>
                  <span className="delivery-count">{invoice.status.toLowerCase()}</span>
                </div>
                <p>
                  {new Intl.NumberFormat("en-AU", {
                    style: "currency",
                    currency: invoice.currency
                  }).format(invoice.amountCents / 100)}
                </p>
                {invoice.paymentReference ? (
                  <small>Operator record: {invoice.paymentReference}</small>
                ) : null}
                {invoice.status === "ISSUED" ? (
                  <form action={updateClientInvoiceAction}>
                    <input type="hidden" name="engagementId" value={engagement.id} />
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <label htmlFor={"invoice-action-" + invoice.id}>
                      Change invoice state
                    </label>
                    <select
                      id={"invoice-action-" + invoice.id}
                      name="status"
                      defaultValue="PAID"
                    >
                      <option value="PAID">Manually record paid</option>
                      <option value="VOID">Void issued invoice</option>
                    </select>
                    <label htmlFor={"invoice-reference-" + invoice.id}>
                      Settlement reference or void reason
                    </label>
                    <input
                      id={"invoice-reference-" + invoice.id}
                      name="reference"
                      minLength={8}
                      maxLength={280}
                      required
                      placeholder="Bank receipt reference or clear void reason"
                    />
                    <button type="submit">Record status change</button>
                  </form>
                ) : null}
              </div>
            ))
          )}
          <p className="delivery-empty">
            Status changes are audited. No payment gateway is connected.
          </p>
        </section>
      </div>
    </section>
  );
}
