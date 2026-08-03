import {TableCell, TableRow} from "@/components/ui/table";

const AdminTableSkeleton = ({columns, rows = 6}: {columns: number; rows?: number}) => {
  return Array.from({length: rows}).map((_, i) => (
    <TableRow key={i} className="hover:bg-transparent">
      {Array.from({length: columns}).map((_, j) => (
        <TableCell key={j}>
          <div className="h-4 bg-zinc-800 rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  ));
};
export default AdminTableSkeleton;
