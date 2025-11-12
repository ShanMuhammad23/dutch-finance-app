import { compactFormat } from "@/lib/format-number";
import { getOverviewData } from "../../fetch";
import { OverviewCard } from "./card";
import * as icons from "./icons";

export async function OverviewCardsGroup() {
  const { views, profit, products, users } = await getOverviewData();

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Total Revenue"
        data={{
          ...views,
          value: compactFormat(views.value),
        }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Total Expenses"
        data={{
          ...profit,
          value: "$" + compactFormat(profit.value),
        }}
        Icon={icons.Profit}
      />

      <OverviewCard
        label="Total Profit"
        data={{
          ...products,
          value: compactFormat(products.value),
        }}
        Icon={icons.Product}
      />

    </div>
  );
}
