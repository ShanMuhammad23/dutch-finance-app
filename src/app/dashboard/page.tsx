import { WeeksProfit } from "@/components/Charts/weeks-profit/client-wrapper";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { OverviewCardsClientWrapper } from "./_components/overview-cards/client-wrapper";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { InvoiceTable } from "@/components/Tables/invoice-table";
import { IncomeExpensesChart } from "@/components/Charts/income-expenses";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  return (
    <>
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsClientWrapper />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <IncomeExpensesChart
          className="col-span-12 xl:col-span-7"
          key={extractTimeFrame("income_expenses")}
          timeFrame={extractTimeFrame("income_expenses")?.split(":")[1]}
        />

        <WeeksProfit
          key={extractTimeFrame("weeks_profit")}
          timeFrame={extractTimeFrame("weeks_profit")?.split(":")[1]}
          className="col-span-12 xl:col-span-5"
        />

        <div className="col-span-12">
          <Suspense fallback={<TopChannelsSkeleton />}>
            <InvoiceTable/>
          </Suspense>
        </div>
      </div>
    </>
  );
}
