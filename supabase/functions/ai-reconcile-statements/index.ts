import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  clientName?: string;
}

interface Receipt {
  id: string;
  description: string;
  amount: number;
  projectTitle?: string;
}

interface MatchSuggestion {
  transactionId: string;
  matchType: 'invoice' | 'receipt' | 'category';
  matchId?: string;
  matchLabel: string;
  confidence: number; // 0-100
  reasoning: string;
  suggestedCategory?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, invoices, receipts } = await req.json() as {
      transactions: Transaction[];
      invoices: Invoice[];
      receipts: Receipt[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for AI
    const invoiceContext = invoices.map(i => 
      `Invoice #${i.invoiceNumber}: $${i.total.toFixed(2)} (${i.status})${i.clientName ? ` - ${i.clientName}` : ''}`
    ).join('\n');

    const receiptContext = receipts.map(r => 
      `Receipt: ${r.description} - $${r.amount.toFixed(2)}${r.projectTitle ? ` (${r.projectTitle})` : ''}`
    ).join('\n');

    const transactionContext = transactions.map(t => 
      `[${t.id}] ${t.date}: ${t.description} - ${t.type === 'credit' ? '+' : '-'}$${t.amount.toFixed(2)}`
    ).join('\n');

    const systemPrompt = `You are a financial reconciliation assistant. Analyze bank transactions and match them to invoices or receipts.

For each transaction, determine:
1. If it matches an invoice (for credits/income)
2. If it matches a receipt (for debits/expenses)
3. If no match, suggest an expense category

Return matches as JSON with confidence scores (0-100) and brief reasoning.

Common expense categories: Advertising, Car & Truck, Commissions, Contract Labor, Insurance, Legal & Professional, Office Expense, Rent, Repairs & Maintenance, Supplies, Taxes & Licenses, Travel, Utilities, Other Expenses.`;

    const userPrompt = `Match these bank transactions to invoices or receipts:

TRANSACTIONS:
${transactionContext}

AVAILABLE INVOICES:
${invoiceContext || 'None'}

AVAILABLE RECEIPTS:
${receiptContext || 'None'}

For each transaction, provide a match suggestion. Return as JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_matches",
              description: "Suggest matches for bank transactions to invoices, receipts, or expense categories",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        transactionId: { type: "string", description: "The transaction ID" },
                        matchType: { 
                          type: "string", 
                          enum: ["invoice", "receipt", "category"],
                          description: "Type of match"
                        },
                        matchId: { type: "string", description: "ID of matched invoice/receipt (if applicable)" },
                        matchLabel: { type: "string", description: "Human-readable label for the match" },
                        confidence: { type: "number", description: "Confidence score 0-100" },
                        reasoning: { type: "string", description: "Brief explanation of why this match was suggested" },
                        suggestedCategory: { type: "string", description: "Expense category if matchType is 'category'" }
                      },
                      required: ["transactionId", "matchType", "matchLabel", "confidence", "reasoning"]
                    }
                  }
                },
                required: ["suggestions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_matches" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract suggestions from tool call
    let suggestions: MatchSuggestion[] = [];
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      suggestions = parsed.suggestions || [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI reconciliation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
