import SearchInput from "./SearchInput";

/**
 * Performs  search page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SearchPage() {
  return (
    <div className="max-w-lg mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Search Members</h1>
      <SearchInput placeholder="Search by name or email..." />
    </div>
  );
}
