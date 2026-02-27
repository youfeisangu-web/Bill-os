import { notFound } from "next/navigation";
import { getQuoteByAcceptToken, acceptQuoteByToken } from "@/app/actions/quote";
import AcceptQuoteForm from "./accept-quote-form";

type Props = { params: Promise<{ token: string }> };

export default async function AcceptQuotePage({ params }: Props) {
  const { token } = await params;
  const quote = await getQuoteByAcceptToken(token);
  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white shadow-sm p-6">
        <h1 className="text-xl font-semibold text-billia-text mb-2">
          見積書のご確認
        </h1>
        <p className="text-sm text-billia-text-muted mb-4">
          見積番号: {quote.quoteNumber} / 取引先: {quote.clientName}
        </p>
        <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
          <dt className="text-billia-text-muted">有効期限</dt>
          <dd>{quote.validUntil}</dd>
          <dt className="text-billia-text-muted">合計金額</dt>
          <dd className="font-medium">¥{quote.totalAmount.toLocaleString()}</dd>
        </dl>
        <ul className="border-t border-black/10 pt-3 mb-6 text-sm">
          {quote.items.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span>{item.name}</span>
              <span>
                {item.quantity} × ¥{item.unitPrice.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>

        {quote.status === "受注" ? (
          <p className="text-center text-emerald-600 font-medium">
            この見積はすでに承諾済みです。
          </p>
        ) : (
          <AcceptQuoteForm token={token} />
        )}
      </div>
    </div>
  );
}
