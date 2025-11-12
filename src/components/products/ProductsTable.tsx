
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const products = [
  {
    code: "PRD-1001",
    name: "Sonic Wireless Headphones",
    number: "SW-HE-01",
    unitPrice: 179.0,
    unitsSold: 320,
    salesExVat: 57280,
  },
  {
    code: "PRD-1002",
    name: "Aurora Smart Lamp",
    number: "AS-LP-09",
    unitPrice: 89.0,
    unitsSold: 410,
    salesExVat: 36490,
  },
  {
    code: "PRD-1003",
    name: "Nimbus Air Purifier",
    number: "NA-PR-17",
    unitPrice: 249.0,
    unitsSold: 185,
    salesExVat: 46065,
  },
  {
    code: "PRD-1004",
    name: "Pulse Fitness Tracker",
    number: "PF-TR-22",
    unitPrice: 129.0,
    unitsSold: 540,
    salesExVat: 69660,
  },
  {
    code: "PRD-1005",
    name: "Vertex 4K Monitor",
    number: "VX-MN-34",
    unitPrice: 399.0,
    unitsSold: 210,
    salesExVat: 83790,
  },
];

const ProductsTable = () => {
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      <Table>
        <TableHeader>
          <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
            <TableHead className="min-w-[140px] xl:pl-7.5">Product code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Number</TableHead>
            <TableHead className="text-right">Unit price</TableHead>
            <TableHead className="text-right">Units sold</TableHead>
            <TableHead className="text-right">Sales (excluding VAT)</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.code} className="border-[#eee] dark:border-dark-3">
              <TableCell className="min-w-[140px] font-medium text-dark dark:text-white xl:pl-7.5">
                {product.code}
              </TableCell>
              <TableCell className="text-dark dark:text-white">{product.name}</TableCell>
              <TableCell className="text-body-sm text-neutral-500 dark:text-neutral-400">
                {product.number}
              </TableCell>
              <TableCell className="text-right text-dark dark:text-white">
                {currencyFormatter.format(product.unitPrice)}
              </TableCell>
              <TableCell className="text-right text-dark dark:text-white">
                {product.unitsSold.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-dark dark:text-white">
                {currencyFormatter.format(product.salesExVat)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable
